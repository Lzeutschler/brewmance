import { COLOR_NAMES, COLORS } from "@/lib/cards/colors";
import { frontFaceName, nameKey } from "@/lib/cards/names";
import type { Color, CommanderSummary } from "@/lib/cards/types";
import type { PreconSummary } from "@/lib/precons/types";

import { FRANCHISE_LABELS, FRANCHISES, franchiseOf, type FranchiseId } from "./franchises";
import { ART, QUESTIONS } from "./questions";
import { buildProfile, createScoringContext, scoreCommander, type ScoringContext } from "./scoring";
import type { AnswerOption, Answers, Question } from "./types";

// The "find your precon" quiz: a few swipe cards for people who have never played, then every
// preconstructed deck ranked by its commander and by the colors, world and age the player asked for.

/** Precons released this many months before the newest one count as still in shops. */
export const RECENT_MONTHS = 24;

/** Answer ids of the precon quiz, by question id. */
export const PRECON_QUIZ = {
  colors: "colors",
  side: "side",
  world: "world",
  size: "size",
  pace: "pace",
  reading: "reading",
  recency: "recency",
} as const;

/** Points of each part of a precon's score that is not about its commander. */
const POINTS = {
  /** Per deck color the player picked. */
  colorHit: 16,
  /** Per deck color the player did not pick: high enough that a well-fitting commander cannot outweigh it. */
  colorOutside: 24,
  /** Per picked color the deck lacks. */
  colorMissing: 8,
  /** Extra when the deck shares no color with the picks. */
  colorNone: 12,
  /** The deck is set in a picked crossover world; stronger than a color outside the picks. */
  franchise: 50,
  /** The deck is set in Magic's own worlds, which the player picked. */
  classicWorld: 20,
  /** The deck is set in a world the player did not pick. */
  franchiseMiss: 30,
  /** The deck is older, while the player wants one still in shops. */
  old: 25,
} as const;

/**
 * Colors and worlds decide the order before anything else: a deck outside the picked worlds, or with a color the
 * player did not pick, never outranks one that fits, however well its commander matches the other answers.
 */
const TIER = { world: 10_000, color: 1_000 } as const;

/** 0: only picked colors, 1: all picks plus others, 2: some picks plus others, 3: none of the picks. */
function colorTier(picked: readonly Color[], identity: readonly Color[]): number {
  if (!picked.length) return 0;
  const hits = identity.filter((c) => picked.includes(c)).length;
  const outside = identity.length - hits;
  if (!outside) return 0;
  if (hits === picked.length) return 1;
  return hits ? 2 : 3;
}

/** Lower 4th and 5th matches still show when they are this close to the 3rd. */
const CLOSE_POINTS = 3;

/** Copies an answer of the commander quiz, so changing one quiz never changes the other. */
function copyOption(option: AnswerOption, patch: Partial<AnswerOption> = {}): AnswerOption {
  return { ...option, effect: { ...option.effect }, ...patch };
}

function beginnerQuestion(id: string): Question {
  const question = QUESTIONS.beginner.find((q) => q.id === id);
  if (!question) throw new Error(`The commander quiz has no "${id}" question`);
  return question;
}

const COLORS_QUESTION: Question = {
  id: PRECON_QUIZ.colors,
  title: "Which colors draw you in?",
  subtitle: "Tap up to two.",
  max: 2,
  card: {
    kind: "pick",
    gate: {
      title: "Do some colors already draw you in?",
      description: "Magic has five colors, and each plays its own way.",
      art: ART.birdsOfParadise,
    },
  },
  options: [
    // The five colors of the advanced commander quiz (basic land art, mana symbols). Colors are matched against
    // each deck's identity here, not through the commander score, so the copies carry no effect.
    ...(QUESTIONS.advanced.find((q) => q.id === "colors")?.options ?? [])
      .filter((o) => (COLORS as string[]).includes(o.id))
      .map((o) => copyOption(o, { effect: {} })),
    { id: "none", label: "No idea yet", exclusive: true, effect: {} },
  ],
};

/** Hero, villain, trickster or wild: one tap on a tile, with the color leanings of the commander quiz. */
const SIDE_QUESTION: Question = {
  id: PRECON_QUIZ.side,
  title: "Who would you rather play?",
  max: 1,
  card: { kind: "pick" },
  options: beginnerQuestion("side").options.map((o) => copyOption(o)),
};

const SIZE_QUESTION: Question = {
  id: PRECON_QUIZ.size,
  title: "Big creatures or lots of small ones?",
  max: 1,
  card: { kind: "versus", left: "wide", right: "big", middle: "both" },
  options: [
    {
      id: "wide",
      label: "Lots of small creatures",
      description: "Fill the table with a crowd and attack together.",
      art: ART.secureTheWastes,
      effect: { archetypes: { tokens: 3, aggro: 1 } },
    },
    { id: "both", label: "A mix of both", art: ART.avengerOfZendikar, effect: {} },
    {
      id: "big",
      label: "A few huge creatures",
      description: "Cast giants that are hard to stop.",
      art: ART.craterhoof,
      effect: { archetypes: { stompy: 3, ramp: 1 } },
    },
  ],
};

/** Fast or slow games, and simple or intricate ones: copies of the commander quiz's cards. */
function copyQuestion(id: string): Question {
  const question = beginnerQuestion(id);
  return { ...question, card: { ...question.card }, options: question.options.map((o) => copyOption(o)) };
}
const PACE_QUESTION = copyQuestion("pace");
const READING_QUESTION = copyQuestion("reading");

const RECENCY_QUESTION: Question = {
  id: PRECON_QUIZ.recency,
  title: "How new should the deck be?",
  max: 1,
  card: { kind: "versus", left: "recent", right: "any" },
  options: [
    {
      id: "recent",
      label: "Only decks you can still find in shops",
      description: "Released in the last two years.",
      art: ART.valleyQuestcaller,
      effect: {},
    },
    {
      id: "any",
      label: "Any deck, older ones too",
      description: "Older decks are often sold second-hand.",
      art: ART.serraAngel,
      effect: {},
    },
  ],
};

/** The worlds that have at least one precon: Magic's own first, then the crossovers in the commander quiz's order. */
export function preconWorlds(precons: readonly Pick<PreconSummary, "set">[]): FranchiseId[] {
  const present = new Set(precons.map((p) => preconFranchise(p)));
  const order: FranchiseId[] = ["magic", ...beginnerQuestion("world").options.map((o) => o.id as FranchiseId), ...FRANCHISES.map((f) => f.id)];
  return [...new Set(order)].filter((id) => present.has(id));
}

/** The world a precon is set in, from its set code. */
export function preconFranchise(precon: Pick<PreconSummary, "set">): FranchiseId {
  return franchiseOf(precon.set.toLowerCase());
}

function worldQuestion(precons: readonly Pick<PreconSummary, "set">[]): Question {
  const art = new Map(beginnerQuestion("world").options.map((o) => [o.id, o]));
  return {
    id: PRECON_QUIZ.world,
    title: "Pick a world you love",
    subtitle: "Some decks are set in other stories. Tap up to three.",
    max: 3,
    card: { kind: "pick" },
    // Worlds are matched against each deck's own set here, not through the commander score.
    options: preconWorlds(precons).map((id) => {
      const option = art.get(id);
      const label = id === "magic" ? "Classic Magic worlds" : id === "marvel" ? "Marvel" : (option?.label ?? FRANCHISE_LABELS[id]);
      return option ? copyOption(option, { label, description: undefined, effect: {} }) : { id, label, effect: {} };
    }),
  };
}

/** The quiz cards, with only the worlds that have a precon. Build it once per precon list. */
export function preconQuestions(precons: readonly Pick<PreconSummary, "set">[]): Question[] {
  return [COLORS_QUESTION, SIDE_QUESTION, worldQuestion(precons), SIZE_QUESTION, PACE_QUESTION, READING_QUESTION, RECENCY_QUESTION];
}

/** The first release date that still counts as in shops: `RECENT_MONTHS` before the newest precon. */
export function recentSince(precons: readonly Pick<PreconSummary, "releaseDate">[]): string | null {
  const newest = precons.reduce<string | null>((max, p) => (max === null || p.releaseDate > max ? p.releaseDate : max), null);
  if (!newest) return null;
  const [year, month, day] = newest.split("-").map(Number);
  const total = year * 12 + (month - 1) - RECENT_MONTHS;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-${pad(day)}`;
}

export interface PreconMatch<T extends PreconSummary = PreconSummary> {
  precon: T;
  score: number;
  /** 1–99, the best match 99. */
  percent: number;
  /** One or two short lines on why it fits, strongest first. */
  reasons: string[];
}

interface Reason {
  text: string;
  weight: number;
}

/** "Black", "Black and green", "White, blue and black". */
function colorList(colors: readonly Color[]): string {
  const names = colors.map((c, i) => (i === 0 ? COLOR_NAMES[c] : COLOR_NAMES[c].toLowerCase()));
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

const SIDE_REASONS: Record<string, string> = {
  hero: "Fits a noble hero",
  villain: "Fits a sinister villain",
  trickster: "Fits a clever trickster",
  wild: "Fits a wild force of nature",
};

/**
 * Every precon ranked for the answers, best first. A precon scores as its best-fitting commander does in
 * the commander quiz, plus its colors against the picked ones, its world against the picked worlds and
 * its age when only decks still in shops are wanted. Ties go to the newer deck.
 */
export function rankPrecons<T extends PreconSummary>(
  precons: readonly T[],
  commanders: readonly CommanderSummary[],
  answers: Answers,
  context: ScoringContext = createScoringContext([...commanders]),
): PreconMatch<T>[] {
  const questions = preconQuestions(precons);
  const profile = buildProfile("beginner", questions, answers);
  const byName = new Map<string, CommanderSummary>();
  for (const commander of commanders) {
    byName.set(nameKey(commander.name), commander);
    const front = nameKey(frontFaceName(commander.name));
    if (!byName.has(front)) byName.set(front, commander);
  }

  const picked = sortedColors((answers[PRECON_QUIZ.colors] ?? []).filter((id): id is Color => (COLORS as string[]).includes(id)));
  const worlds = (answers[PRECON_QUIZ.world] ?? []) as FranchiseId[];
  const side = answers[PRECON_QUIZ.side]?.[0];
  const size = answers[PRECON_QUIZ.size]?.[0];
  const pace = answers[PRECON_QUIZ.pace]?.[0];
  const reading = answers[PRECON_QUIZ.reading]?.[0];
  const recentOnly = answers[PRECON_QUIZ.recency]?.[0] === "recent";
  const since = recentSince(precons);
  const sideColor = sideColorOf(side);

  const scored = precons.map((precon) => {
    const reasons: Reason[] = [];
    const year = precon.releaseDate.slice(0, 4);

    // The commander that fits best speaks for the deck.
    let lead: CommanderSummary | null = null;
    let score = 0;
    for (const name of precon.commanders) {
      const commander = byName.get(nameKey(name)) ?? byName.get(nameKey(frontFaceName(name)));
      if (!commander) continue;
      const s = scoreCommander(commander, profile, context, "balanced").score;
      if (!lead || s > score) {
        lead = commander;
        score = s;
      }
    }

    // Colors against the picks.
    const identity = precon.colorIdentity;
    if (picked.length) {
      const hits = identity.filter((c) => picked.includes(c));
      const outside = identity.filter((c) => !picked.includes(c));
      const missing = picked.filter((c) => !identity.includes(c));
      score += hits.length * POINTS.colorHit - outside.length * POINTS.colorOutside - missing.length * POINTS.colorMissing;
      if (!hits.length) score -= POINTS.colorNone;
      score -= colorTier(picked, identity) * TIER.color;
      if (hits.length && !outside.length && !missing.length) {
        reasons.push({ text: `${colorList(hits)}, like you picked`, weight: 3.5 });
      } else if (hits.length && !outside.length) {
        reasons.push({ text: `${colorList(hits)}, one of your colors`, weight: 2.5 });
      } else if (hits.length === picked.length && outside.length) {
        reasons.push({ text: `${colorList(picked)}, plus ${colorList(sortedColors(outside)).toLowerCase()}`, weight: 2.4 });
      }
    }

    // The world the deck is set in.
    const franchise = preconFranchise(precon);
    if (worlds.length) {
      if (!worlds.includes(franchise)) score -= POINTS.franchiseMiss + TIER.world;
      else if (franchise === "magic") {
        score += POINTS.classicWorld;
        reasons.push({ text: "Set in a classic Magic world", weight: 0.8 });
      } else {
        score += POINTS.franchise;
        reasons.push({ text: `From ${FRANCHISE_LABELS[franchise]}`, weight: 4 });
      }
    }

    // Still in shops.
    const recent = since !== null && precon.releaseDate >= since;
    if (recentOnly) {
      if (!recent) score -= POINTS.old;
      else reasons.push({ text: `Released in ${year}`, weight: 0.5 });
    }

    // How the commander plays, in the player's words.
    if (sideColor && identity.includes(sideColor) && side) reasons.push({ text: SIDE_REASONS[side], weight: 1.5 });
    if (lead) {
      if (size === "big" && (lead.archetypes.stompy ?? 0) >= 0.5) reasons.push({ text: "Plays a big-creature game", weight: 2 });
      if (size === "wide" && (lead.archetypes.tokens ?? 0) >= 0.5) reasons.push({ text: "Plays lots of small creatures", weight: 2 });
      if (pace === "fast" && lead.cmc <= 3) reasons.push({ text: "Gets going early", weight: 1 });
      if (pace === "big" && lead.cmc >= 5) reasons.push({ text: "Builds up to big turns", weight: 1 });
      const complexity = context.complexity.get(lead.id) ?? 0.5;
      if (reading === "simple" && complexity <= 0.35) reasons.push({ text: "Simple to play", weight: 1.2 });
      if (reading === "complex" && complexity >= 0.65) reasons.push({ text: "Lots to figure out", weight: 1.2 });
    }

    const texts = reasons.sort((a, b) => b.weight - a.weight).slice(0, 2).map((r) => r.text);
    return { precon, score: Math.round(score * 10) / 10, reasons: texts.length ? texts : [`Released in ${year}`] };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.precon.releaseDate.localeCompare(a.precon.releaseDate) ||
      a.precon.name.localeCompare(b.precon.name) ||
      a.precon.id.localeCompare(b.precon.id),
  );
  const top = scored[0]?.score ?? 0;
  // Percentages compare decks within the best tier; decks in lower tiers show as weak matches.
  const band = scored.filter((s) => s.score > top - TIER.color / 2);
  const bottom = band.at(-1)?.score ?? 0;
  return scored.map((s) => ({ ...s, percent: matchPercent(s.score, top, bottom) }));
}

/** A score as a match percentage between the lowest (1) and the best (99) score. */
export function matchPercent(score: number, top: number, bottom: number): number {
  if (top <= bottom) return 99;
  return Math.max(1, Math.min(99, Math.round(((score - bottom) / (top - bottom)) * 99)));
}

/** The best three matches, plus a 4th and 5th when they are about as good as the 3rd. */
export function topPreconMatches<T extends PreconSummary>(ranked: readonly PreconMatch<T>[]): PreconMatch<T>[] {
  const third = ranked[2];
  if (!third) return ranked.slice(0, 3);
  return [...ranked.slice(0, 3), ...ranked.slice(3, 5).filter((m) => m.score >= third.score - CLOSE_POINTS)];
}

function sortedColors(colors: readonly Color[]): Color[] {
  return COLORS.filter((c) => colors.includes(c));
}

/** The color a side of the commander quiz leans to most: white for heroes, black for villains, … */
function sideColorOf(side: string | undefined): Color | null {
  const lean = SIDE_QUESTION.options.find((o) => o.id === side)?.effect.colorLean ?? {};
  const best = (Object.entries(lean) as [Color, number][]).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}
