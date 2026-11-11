import { CURVE_LABELS } from "@/lib/cards/mana";
import type { CardImage, Color } from "@/lib/cards/types";
import { BRACKET_INFO, deckBracketIssues } from "@/lib/deckbuilder/brackets";
import { DEFAULT_SETTINGS } from "@/lib/deckbuilder/settings";
import { karstenLands, recommendTemplate, TEMPLATE_ROLE_LABELS, type TemplateRole } from "@/lib/deckbuilder/template";
import { canUpgrade } from "@/lib/deckbuilder/upgrade";
import { commandZone, deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import { CARD_TYPES, deckStats, expandEntries, primaryType, type CardType } from "@/lib/decks/stats";
import type { Deck } from "@/lib/decks/types";
import type { Bracket } from "@/lib/edhrec/types";

import { PRECON_BRACKET, type PreconDeck } from "./deck";

/** Roles compared with typical targets. Finishers are left out: their tags are too sparse to count on. */
export const ANALYSIS_ROLES = ["ramp", "draw", "interaction", "boardwipe", "protection"] as const satisfies readonly TemplateRole[];

export type AnalysisRole = (typeof ANALYSIS_ROLES)[number];

/** Karsten's land formula is fitted to full decks; below this many nonland cards it says little. */
const KARSTEN_MIN_NONLANDS = 40;

export interface PreconRoleCount {
  role: AnalysisRole;
  /** "Ramp", "Card Draw", … */
  label: string;
  have: number;
  /** Typical count for a Core (bracket 2) deck without commander-specific data. */
  target: number;
}

export interface PreconCardRow {
  name: string;
  count: number;
  manaCost: string;
  gameChanger: boolean;
  image: CardImage | null;
}

export interface PreconTypeGroup {
  type: CardType;
  /** Cards of this type, counting copies. */
  count: number;
  /** Cheapest first, then by name. */
  cards: PreconCardRow[];
}

export interface PreconCommander {
  name: string;
  manaCost: string;
  typeLine: string;
  colorIdentity: Color[];
  image: CardImage | null;
  gameChanger: boolean;
}

/** What a precon is made of, compared with typical Core targets. Plain data, safe to serialize. */
export interface PreconAnalysis {
  /** The whole deck, commanders included (normally 100). */
  deckSize: number;
  /** Cards besides the commanders. */
  mainDeck: number;
  /** What the main deck should hold: 99, or 98 with a partner. */
  mainDeckTarget: number;
  lands: number;
  nonlands: number;
  /** Average mana value of the nonland cards, rounded to two decimals. */
  averageManaValue: number;
  /** Nonland cards per mana value bucket, labelled by `curveLabels`. */
  curve: number[];
  curveLabels: string[];
  roles: PreconRoleCount[];
  /** Roles below their typical target. */
  thin: AnalysisRole[];
  /** Roles well above their typical target. */
  plenty: AnalysisRole[];
  landAdvice: {
    have: number;
    /** Frank Karsten's suggestion for this curve and cheap ramp and draw, rounded; null for decks too small to tell. */
    karsten: number | null;
    /** The typical Core land count. */
    typical: number;
  };
  /** Ramp and draw spells with mana value 2 or less, which let a deck play fewer lands. */
  cheapRampDraw: number;
  /** Names of the Game Changers in the deck, commanders included. */
  gameChangers: string[];
  /** Names of the cards tagged as mass land denial, commanders included. */
  massLandDenial: string[];
  bracket: {
    bracket: Bracket;
    /** "Core". */
    name: string;
    /** No rule of the bracket is broken by the cards checked. Two-card combos were not checked. */
    fits: boolean;
    issues: string[];
    /** Always false: combos need Commander Spellbook, which static pages do not call. */
    combosChecked: false;
  };
  /** Whether the upgrade flow accepts this deck (enough cards resolved). */
  canUpgrade: boolean;
  groups: PreconTypeGroup[];
  commanders: PreconCommander[];
  colorIdentity: Color[];
  /** Listed card names the card database does not know. */
  missing: string[];
}

/** How far above the target a role counts as plentiful: at least 2, or a quarter of the target. */
function plentyMargin(target: number): number {
  return Math.max(2, Math.ceil(target / 4));
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** The analysis of a resolved precon, using only its own cards and the bracket defaults. */
export function analyzePrecon(deck: PreconDeck): PreconAnalysis {
  const zone = commandZone(deck);
  const identity = deckIdentity(deck);
  const stats = deckStats(deck);
  const size = mainDeckSize(deck);
  const template = recommendTemplate(PRECON_BRACKET, identity, null, size);

  const roles: PreconRoleCount[] = ANALYSIS_ROLES.map((role) => ({
    role,
    label: TEMPLATE_ROLE_LABELS[role],
    have: stats.roles[role],
    target: template.roles[role],
  }));

  // The commanders count for the bracket: a Game Changer in the command zone is still a Game Changer.
  const cards = [...zone, ...expandEntries(deck.entries)];
  const issues = deckBracketIssues(cards, PRECON_BRACKET);
  const gameChangers = [...new Set(cards.filter((c) => c.gameChanger).map((c) => c.name))];
  const massLandDenial = [...new Set(cards.filter((c) => c.roles.includes("mld")).map((c) => c.name))];

  const groups: PreconTypeGroup[] = [];
  for (const type of [...CARD_TYPES, "Other"] as const) {
    const entries = deck.entries
      .filter((e) => primaryType(e.card) === type)
      .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name));
    if (!entries.length) continue;
    groups.push({
      type,
      count: entries.reduce((sum, e) => sum + e.quantity, 0),
      cards: entries.map(({ card, quantity }) => ({
        name: card.name,
        count: quantity,
        manaCost: card.manaCost,
        gameChanger: card.gameChanger,
        image: card.image,
      })),
    });
  }

  const asDeck: Deck = { ...deck, id: "", maybe: [], settings: DEFAULT_SETTINGS, createdAt: 0, updatedAt: 0 };

  return {
    deckSize: stats.total + zone.length,
    mainDeck: stats.total,
    mainDeckTarget: size,
    lands: stats.lands,
    nonlands: stats.nonlands,
    averageManaValue: round(stats.averageManaValue, 2),
    curve: stats.curve,
    curveLabels: [...CURVE_LABELS],
    roles,
    thin: roles.filter((r) => r.have < r.target).map((r) => r.role),
    plenty: roles.filter((r) => r.have >= r.target + plentyMargin(r.target)).map((r) => r.role),
    landAdvice: {
      have: stats.lands,
      karsten:
        stats.nonlands >= KARSTEN_MIN_NONLANDS ? Math.round(karstenLands(stats.averageManaValue, stats.cheapRampDraw)) : null,
      typical: template.lands,
    },
    cheapRampDraw: stats.cheapRampDraw,
    gameChangers,
    massLandDenial,
    bracket: {
      bracket: PRECON_BRACKET,
      name: BRACKET_INFO[PRECON_BRACKET].name,
      fits: issues.length === 0,
      issues,
      combosChecked: false,
    },
    canUpgrade: canUpgrade(asDeck),
    groups,
    commanders: zone.map((card) => ({
      name: card.name,
      manaCost: card.manaCost,
      typeLine: card.typeLine,
      colorIdentity: card.colorIdentity,
      image: card.image,
      gameChanger: card.gameChanger,
    })),
    colorIdentity: identity,
    missing: deck.missing,
  };
}
