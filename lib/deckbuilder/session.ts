import { isLand } from "@/lib/cards/mana";
import type { Card } from "@/lib/cards/types";
import { deckStats, expandEntries } from "@/lib/decks/stats";
import { commandZone, deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";
import { seededRandom } from "@/lib/random";

import { fillBasics } from "./basics";
import { bracketViolation } from "./brackets";
import { combosCompletedBy, type Combo } from "./combos";
import { scoreCandidate, type ScoreContext } from "./score";
import { deckTemplate } from "./settings";
import { profilePool, recommendTemplate } from "./template";
import type { Candidate, CandidatePool } from "./types";

export type SwipeDecision = "pick" | "pass" | "maybe";
export type SwipePhase = "spells" | "lands" | "done";

export interface SwipeHistoryEntry {
  cardId: string;
  decision: SwipeDecision;
  phase: SwipePhase;
}

export interface SwipeSession {
  deckId: string;
  pool: Candidate[];
  basicLands: Card[];
  source: CandidatePool["source"];
  deckCount: number;
  phase: SwipePhase;
  history: SwipeHistoryEntry[];
  seed: number;
  /** Commander Spellbook combos within the pool; null when Spellbook could not be reached. */
  combos: Combo[] | null;
  /** Oracle ids of cards swiped left for this commander before this session started. */
  previouslyPassed: string[];
  /** Set by "Skip to lands": no more spells, even when spell slots are still open. */
  skippedSpells?: boolean;
}

/** The next card is drawn at random from this many best-scored options so swiping feels fresh. */
const TOP_CHOICES = 5;

/**
 * Starts swiping for `deck` and stores the template recommended for its commander on the deck.
 * A deck that already has cards resumes in the matching phase.
 */
export function startSession(
  deck: Deck,
  pool: CandidatePool,
  seed: number,
  previouslyPassed: string[] = [],
): { session: SwipeSession; deck: Deck } {
  const nextDeck: Deck = {
    ...deck,
    recommendation: recommendTemplate(deck.bracket, deckIdentity(deck), profilePool(pool), mainDeckSize(deck)),
  };
  const session: SwipeSession = {
    deckId: deck.id,
    pool: pool.candidates,
    basicLands: pool.basicLands,
    source: pool.source,
    deckCount: pool.deckCount,
    phase: "spells",
    history: [],
    seed,
    combos: pool.combos,
    previouslyPassed,
  };
  return { session: { ...session, phase: currentPhase(session, nextDeck) }, deck: nextDeck };
}

/** Candidates still on offer that keep the deck within its bracket and the deck's settings. */
function openCandidates(session: SwipeSession, deck: Deck, lands: boolean): Candidate[] {
  const { preferences } = deck.settings;
  const template = deckTemplate(deck);
  const seen = new Set(session.history.map((h) => h.cardId));
  const hidden = new Set(preferences.hidePassed ? session.previouslyPassed : []);
  const deckCards = expandEntries(deck.entries);
  const inDeck = new Set(deckCards.map((c) => c.id));
  const tutorsFull = template.maxTutors !== null && deckCards.filter((c) => !isLand(c) && c.roles.includes("tutor")).length >= template.maxTutors;
  const context = { commanders: commandZone(deck).map((c) => c.name), combos: session.combos };
  return session.pool.filter(
    (c) =>
      isLand(c) === lands &&
      !seen.has(c.id) &&
      !inDeck.has(c.id) &&
      !hidden.has(c.oracleId) &&
      !(tutorsFull && c.roles.includes("tutor")) &&
      !(preferences.maxPriceUsd !== null && c.priceUsd !== null && c.priceUsd > preferences.maxPriceUsd) &&
      !(preferences.gameChangers === "avoid" && c.gameChanger) &&
      bracketViolation(c, deckCards, deck.bracket, context) === null,
  );
}

/** Everything the scorer needs to know about the deck right now. */
export function scoreContext(session: SwipeSession, deck: Deck): ScoreContext {
  return deckScoreContext(deck, session.combos);
}

/** The scorer's view of `deck`, with the Commander Spellbook combos known for its card pool. */
export function deckScoreContext(deck: Deck, knownCombos: readonly Combo[] | null): ScoreContext {
  const have = new Set([...commandZone(deck).map((c) => c.name), ...deck.entries.map((e) => e.card.name)]);
  const combos = deck.bracket >= 4 ? (knownCombos ?? []) : [];
  return {
    stats: deckStats(deck),
    template: deckTemplate(deck),
    preferences: deck.settings.preferences,
    identity: deckIdentity(deck),
    combosCompleted: (card) => (combos.length ? combosCompletedBy(card.name, combos, have) : []),
  };
}

export function rankCandidates(session: SwipeSession, deck: Deck): { candidate: Candidate; score: number }[] {
  if (session.phase === "done") return [];
  const ctx = scoreContext(session, deck);
  return openCandidates(session, deck, session.phase === "lands")
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, ctx) }))
    .sort((a, b) => b.score - a.score);
}

export function nextCandidate(session: SwipeSession, deck: Deck): Candidate | null {
  const top = rankCandidates(session, deck).slice(0, TOP_CHOICES);
  if (!top.length) return null;

  // Weighted pick: better scores are likelier, deterministic for a given session state.
  const min = top[top.length - 1].score;
  const weights = top.map((t) => (t.score - min + 0.1) ** 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = seededRandom(session.seed + session.history.length * 7919)() * total;
  for (let i = 0; i < top.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return top[i].candidate;
  }
  return top[0].candidate;
}

/**
 * Spells until the spell slots are full, then nonbasic lands up to their target, then done. Derived
 * from the deck each time, so changed settings move the swipe to the right phase straight away.
 */
function currentPhase(session: SwipeSession, deck: Deck): SwipePhase {
  const stats = deckStats(deck);
  const template = deckTemplate(deck);
  if (stats.total >= template.size) return "done";
  if (!session.skippedSpells && stats.nonlands < template.size - template.lands && openCandidates(session, deck, false).length) {
    return "spells";
  }
  if (stats.lands < template.nonbasicLands && openCandidates(session, deck, true).length) return "lands";
  return "done";
}

/** Re-evaluates the phase after the deck's settings changed. */
export function refreshSession(session: SwipeSession, deck: Deck): SwipeSession {
  const phase = currentPhase(session, deck);
  return phase === session.phase ? session : { ...session, phase };
}

export function decide(
  session: SwipeSession,
  deck: Deck,
  card: Candidate,
  decision: SwipeDecision,
): { session: SwipeSession; deck: Deck } {
  const nextDeck: Deck = {
    ...deck,
    entries: decision === "pick" ? [...deck.entries, { card: stripCandidate(card), quantity: 1 }] : deck.entries,
    maybe: decision === "maybe" ? [...deck.maybe, stripCandidate(card)] : deck.maybe,
    updatedAt: Date.now(),
  };
  const nextSession: SwipeSession = {
    ...session,
    history: [...session.history, { cardId: card.id, decision, phase: session.phase }],
  };
  return { session: { ...nextSession, phase: currentPhase(nextSession, nextDeck) }, deck: nextDeck };
}

export function undo(session: SwipeSession, deck: Deck): { session: SwipeSession; deck: Deck } {
  const last = session.history.at(-1);
  if (!last) return { session, deck };
  const nextDeck: Deck = {
    ...deck,
    entries: last.decision === "pick" ? deck.entries.filter((e) => e.card.id !== last.cardId) : deck.entries,
    maybe: last.decision === "maybe" ? deck.maybe.filter((c) => c.id !== last.cardId) : deck.maybe,
    updatedAt: Date.now(),
  };
  const nextSession: SwipeSession = {
    ...session,
    history: session.history.slice(0, -1),
    skippedSpells: last.phase === "spells" ? false : session.skippedSpells,
  };
  return { session: { ...nextSession, phase: currentPhase(nextSession, nextDeck) }, deck: nextDeck };
}

export function skipToLands(session: SwipeSession, deck: Deck): SwipeSession {
  const skipped = { ...session, skippedSpells: true };
  return { ...skipped, phase: currentPhase(skipped, deck) };
}

/**
 * Completes the deck: open spell slots get the best-scored suggestions still on offer, one at a time so
 * each pick sees the roles the previous ones filled, then basics fill the land slots. Stopping early
 * therefore never turns the rest of the deck into basic lands.
 */
export function finish(session: SwipeSession, deck: Deck): Deck {
  const template = deckTemplate(deck);
  const spells: SwipeSession = { ...session, phase: "spells" };
  let entries = deck.entries;
  while (deckStats({ entries }).nonlands < template.size - template.lands) {
    const best = rankCandidates(spells, { ...deck, entries })[0];
    if (!best) break;
    entries = [...entries, { card: stripCandidate(best.candidate), quantity: 1 }];
  }
  return {
    ...deck,
    entries: fillBasics(entries, deckIdentity(deck), session.basicLands, template.lands, template.size),
    updatedAt: Date.now(),
  };
}

/** Deck entries store plain cards, without the swipe scores. */
export function stripCandidate(candidate: Candidate): Card {
  const { synergy: _synergy, inclusion: _inclusion, ...card } = candidate;
  return card;
}
