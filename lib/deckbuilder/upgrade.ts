import { CURVE_LABELS, curveBucket, isLand } from "@/lib/cards/mana";
import { isBasicLandName } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { commandZone, deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import { deckCount, deckStats, expandEntries } from "@/lib/decks/stats";
import type { Deck, DeckEntry } from "@/lib/decks/types";

import { bracketViolation } from "./brackets";
import { explainCandidate, scoreCandidate, type CandidateReason, type ScoreContext } from "./score";
import { deckScoreContext, stripCandidate } from "./session";
import { deckTemplate } from "./settings";
import { TEMPLATE_ROLES, TEMPLATE_ROLE_LABELS, profilePool, recommendTemplate, templateRoles } from "./template";
import type { Candidate, CandidatePool } from "./types";

/**
 * What to do with a suggested swap: "swap" trades the cards, "pass" and "maybe" turn the new card down
 * (maybe keeps it on the maybe list), "keep" protects the deck's card from further suggestions.
 */
export type UpgradeDecision = "swap" | "pass" | "maybe" | "keep";

export interface UpgradeHistoryEntry {
  out: Card;
  in: Card;
  decision: UpgradeDecision;
}

/** An upgrade in progress. The candidate pool is loaded again on each visit and not stored. */
export interface UpgradeSession {
  deckId: string;
  /** Most the added cards may cost together in USD; null means no limit. */
  budgetUsd: number | null;
  history: UpgradeHistoryEntry[];
}

/** What the upgrade needs from the candidate pool. */
export type UpgradePool = Pick<CandidatePool, "candidates" | "combos" | "source" | "deckCount" | "averageLands">;

/** One suggestion: take `out` from the deck and play `in` instead. */
export interface Swap {
  out: Candidate;
  in: Candidate;
  /** How much better the deck scores `in` than `out` in the same slot. */
  gain: number;
}

/** Swaps that improve the deck by less than this are not worth a swipe. */
const MIN_GAIN = 0.3;
/**
 * Extra improvement a swap must bring per share of decks that play the card to cut: a card half of all
 * decks keep needs a far better replacement than one hardly anybody plays.
 */
const PLAYED_CARD_BAR = 1;
/** How many of the weakest spells, and of the weakest lands, get a replacement looked up. */
const WEAKEST_SPELLS = 6;
const WEAKEST_LANDS = 3;
/** Most of a budget one card may take, so a single pricey staple does not use it up. */
export const MAX_BUDGET_SHARE = 0.4;
/** Below this share of its cards a deck should be finished first: swaps keep the card count. */
export const MIN_DECK_SHARE = 0.9;

/** Whether the deck is full enough to trade cards one for one. */
export function canUpgrade(deck: Deck): boolean {
  return deckCount(deck.entries) >= Math.floor(mainDeckSize(deck) * MIN_DECK_SHARE);
}

/** Starts an upgrade and stores the template recommended for the deck's commander on the deck. */
export function startUpgrade(deck: Deck, pool: UpgradePool, budgetUsd: number | null): { session: UpgradeSession; deck: Deck } {
  return {
    session: { deckId: deck.id, budgetUsd, history: [] },
    deck: { ...deck, recommendation: recommendTemplate(deck.bracket, deckIdentity(deck), profilePool(pool), mainDeckSize(deck)) },
  };
}

/**
 * A deck card with the fit numbers the pool has for it. Cards the pool does not list are ones decks of
 * this commander hardly play; without deck statistics their overall popularity stands in.
 */
export function fitOf(card: Card, pool: UpgradePool, byId = poolIndex(pool)): Candidate {
  const known = byId.get(card.id);
  if (known) return known;
  const popularity = card.edhrecRank ? 1 - Math.min(card.edhrecRank, 30000) / 30000 : 0;
  return { ...card, synergy: 0, inclusion: pool.source === "fallback" ? popularity * 0.5 : 0 };
}

function poolIndex(pool: UpgradePool): Map<string, Candidate> {
  return new Map(pool.candidates.map((c) => [c.id, c]));
}

/** What the added cards of the session cost together. */
export function spentUsd(session: UpgradeSession): number {
  return session.history.reduce((sum, h) => sum + (h.decision === "swap" ? (h.in.priceUsd ?? 0) : 0), 0);
}

/** The swaps made so far, oldest first. */
export function swapsMade(session: UpgradeSession): UpgradeHistoryEntry[] {
  return session.history.filter((h) => h.decision === "swap");
}

function withoutOne(entries: readonly DeckEntry[], cardId: string): DeckEntry[] {
  return entries.flatMap((e) => (e.card.id !== cardId ? [e] : e.quantity > 1 ? [{ ...e, quantity: e.quantity - 1 }] : []));
}

/** The scorer's view of the deck once `out` has left it: the slot both cards of a swap compete for. */
export function slotContext(deck: Deck, pool: UpgradePool, out: Card): ScoreContext {
  return deckScoreContext({ ...deck, entries: withoutOne(deck.entries, out.id) }, pool.combos);
}

/**
 * The best swap for each of the deck's weakest cards, most improving first. A card's worth is the score
 * it would get as a suggestion for its own slot, so cards holding up a role or the curve are safe while
 * off-plan, crowded or rarely played ones come up. Spells trade for spells and lands for lands, which
 * keeps the land count; a basic land only makes room while the deck is short of nonbasic lands.
 */
export function rankSwaps(deck: Deck, pool: UpgradePool, session: UpgradeSession): Swap[] {
  const byId = poolIndex(pool);
  const { preferences } = deck.settings;
  const template = deckTemplate(deck);
  const kept = new Set(session.history.filter((h) => h.decision === "keep").map((h) => h.out.id));
  const turnedDown = new Set(session.history.filter((h) => h.decision === "pass" || h.decision === "maybe").map((h) => h.in.id));
  const swaps = swapsMade(session);
  const swappedIn = new Set(swaps.map((h) => h.in.id));
  const swappedOut = new Set(swaps.map((h) => h.out.id));
  const inDeck = new Set(deck.entries.map((e) => e.card.id));
  const budgetLeft = session.budgetUsd === null ? Infinity : session.budgetUsd - spentUsd(session);
  const priceLimit = Math.min(budgetLeft, (session.budgetUsd ?? Infinity) * MAX_BUDGET_SHARE, preferences.maxPriceUsd ?? Infinity);
  const nonbasics = deck.entries.filter((e) => isLand(e.card) && !isBasicLandName(e.card.name)).length;

  const cuttable = deck.entries.filter((e) => {
    if (kept.has(e.card.id) || swappedIn.has(e.card.id)) return false;
    if (isBasicLandName(e.card.name)) return nonbasics < template.nonbasicLands;
    return e.quantity === 1;
  });
  // Of the basics only the most numerous one is up for a trade.
  const basics = cuttable.filter((e) => isBasicLandName(e.card.name)).sort((a, b) => b.quantity - a.quantity);
  const worth = cuttable
    .filter((e) => !isBasicLandName(e.card.name) || e === basics[0])
    .map((entry) => {
      const out = fitOf(entry.card, pool, byId);
      const ctx = slotContext(deck, pool, out);
      // Staples like Sol Ring have negative synergy (every deck plays them), which is no reason to cut them.
      return { out, ctx, keep: scoreCandidate({ ...out, synergy: Math.max(0, out.synergy) }, ctx) };
    })
    .sort((a, b) => a.keep - b.keep);
  const weakest = [
    ...worth.filter((w) => !isLand(w.out)).slice(0, WEAKEST_SPELLS),
    ...worth.filter((w) => isLand(w.out)).slice(0, WEAKEST_LANDS),
  ];

  const context = { commanders: commandZone(deck).map((c) => c.name), combos: pool.combos };
  const result: Swap[] = [];
  for (const { out, ctx, keep } of weakest) {
    const rest = expandEntries(withoutOne(deck.entries, out.id));
    const tutorsFull = template.maxTutors !== null && rest.filter((c) => !isLand(c) && c.roles.includes("tutor")).length >= template.maxTutors;
    let best: { candidate: Candidate; score: number } | null = null;
    for (const candidate of pool.candidates) {
      if (
        isLand(candidate) !== isLand(out) ||
        inDeck.has(candidate.id) ||
        turnedDown.has(candidate.id) ||
        swappedOut.has(candidate.id) ||
        (tutorsFull && candidate.roles.includes("tutor")) ||
        (candidate.priceUsd !== null && candidate.priceUsd > priceLimit) ||
        (preferences.gameChangers === "avoid" && candidate.gameChanger)
      ) {
        continue;
      }
      const score = scoreCandidate(candidate, ctx);
      if (best && score <= best.score) continue;
      if (bracketViolation(candidate, rest, deck.bracket, context) !== null) continue;
      best = { candidate, score };
    }
    if (best && best.score - keep >= MIN_GAIN + PLAYED_CARD_BAR * out.inclusion) {
      result.push({ out, in: best.candidate, gain: best.score - keep });
    }
  }
  return result.sort((a, b) => b.gain - a.gain);
}

export function nextSwap(deck: Deck, pool: UpgradePool, session: UpgradeSession): Swap | null {
  return rankSwaps(deck, pool, session)[0] ?? null;
}

export function decideSwap(
  session: UpgradeSession,
  deck: Deck,
  swap: Pick<Swap, "out" | "in">,
  decision: UpgradeDecision,
): { session: UpgradeSession; deck: Deck } {
  const added = stripCandidate(swap.in);
  const entry: UpgradeHistoryEntry = { out: stripCandidate(swap.out), in: added, decision };
  return {
    session: { ...session, history: [...session.history, entry] },
    deck: {
      ...deck,
      entries: decision === "swap" ? [...withoutOne(deck.entries, swap.out.id), { card: added, quantity: 1 }] : deck.entries,
      maybe: decision === "maybe" && !deck.maybe.some((c) => c.id === added.id) ? [...deck.maybe, added] : deck.maybe,
      updatedAt: Date.now(),
    },
  };
}

export function undoSwap(session: UpgradeSession, deck: Deck): { session: UpgradeSession; deck: Deck } {
  const last = session.history.at(-1);
  if (!last) return { session, deck };
  let entries = deck.entries;
  // A swap is only taken back while the added card is still in the deck (it may have been edited since).
  if (last.decision === "swap" && entries.some((e) => e.card.id === last.in.id)) {
    entries = entries.filter((e) => e.card.id !== last.in.id);
    entries = entries.some((e) => e.card.id === last.out.id)
      ? entries.map((e) => (e.card.id === last.out.id ? { ...e, quantity: e.quantity + 1 } : e))
      : [...entries, { card: last.out, quantity: 1 }];
  }
  return {
    session: { ...session, history: session.history.slice(0, -1) },
    deck: {
      ...deck,
      entries,
      maybe: last.decision === "maybe" ? deck.maybe.filter((c) => c.id !== last.in.id) : deck.maybe,
      updatedAt: Date.now(),
    },
  };
}

/** Why the deck gains from playing the swap's new card in the slot, most telling first. */
export function explainAdd(swap: Swap, deck: Deck, pool: UpgradePool, commanderName: string): CandidateReason[] {
  return explainCandidate(swap.in, slotContext(deck, pool, swap.out), commanderName);
}

/** Why the swap's old card is the one to go, most telling first. */
export function explainCut(swap: Swap, deck: Deck, pool: UpgradePool, commanderName: string): string[] {
  const { out } = swap;
  const stats = deckStats(deck);
  const template = deckTemplate(deck);
  const reasons: string[] = [];

  if (isBasicLandName(out.name)) {
    const quantity = deck.entries.find((e) => e.card.id === out.id)?.quantity ?? 1;
    return [`One of ${quantity} ${out.name}${quantity === 1 ? "" : "s"}; the deck can use more lands that do extra work`];
  }
  if (pool.source === "edhrec") {
    if (out.inclusion === 0) reasons.push(`Hardly any ${commanderName} deck plays it`);
    else if (out.inclusion < 0.25) reasons.push(`Only in ${Math.max(1, Math.round(out.inclusion * 100))}% of ${commanderName} decks`);
  }
  if (isLand(out)) return reasons.length ? reasons : ["The land the deck misses least"];

  for (const role of templateRoles(out)) {
    if (stats.roles[role] > template.roles[role]) {
      reasons.push(`More ${TEMPLATE_ROLE_LABELS[role].toLowerCase()} than the deck needs (${stats.roles[role]}/${template.roles[role]})`);
    }
  }
  const bucket = curveBucket(out.cmc);
  if (stats.curve[bucket] > template.curve[bucket]) {
    reasons.push(`The ${CURVE_LABELS[bucket]} mana slot is crowded (${stats.curve[bucket]}/${template.curve[bucket]})`);
  }
  const offPlan = !templateRoles(out).length && TEMPLATE_ROLES.some((role) => stats.roles[role] < template.roles[role]);
  if (offPlan) reasons.push("Fills none of the roles the deck is short on");
  return reasons.length ? reasons : ["The weakest fit in the deck right now"];
}
