import { COLOR_NAMES, COLORS, identityName, sortColors } from "@/lib/cards/colors";
import type { Color } from "@/lib/cards/types";
import type { GlossaryTermId } from "@/lib/learn";
import { identityKey } from "@/lib/precons/slug";

import { ART } from "./questions";
import type { Answers, Question } from "./types";

// The color quiz at /quiz/colors: six short cards that work for someone who has never played. Every answer leans
// toward one or more colors of Magic's color pie, and the last card sets how many colors the result has. The
// "side" and "mood" answers are copies of the commander quiz's beginner track (with only the color part of their
// effect), so changing them here never changes that quiz.

/** Id of the last question, whose answer sets how many colors the result has. */
export const COUNT_QUESTION = "count";

export const COLOR_QUESTIONS: Question[] = [
  {
    id: "side",
    title: "Who would you rather play?",
    max: 1,
    card: { kind: "yesno" },
    options: [
      {
        id: "hero",
        label: "Noble hero",
        description: "Protect the innocent and lead with honor.",
        art: ART.lyraDawnbringer,
        effect: { colorLean: { W: 2, G: 0.5, B: -1 } },
      },
      {
        id: "villain",
        label: "Sinister villain",
        description: "Power at any price.",
        art: ART.sheoldred,
        effect: { colorLean: { B: 2, R: 0.5, W: -1 } },
      },
      {
        id: "trickster",
        label: "Clever trickster",
        description: "Outsmart everyone and steal the show.",
        art: ART.brazenBorrower,
        effect: { colorLean: { U: 2, B: 0.5 } },
      },
      {
        id: "wild",
        label: "Wild force of nature",
        description: "Raw power and roaring beasts.",
        art: ART.thragtusk,
        effect: { colorLean: { G: 2, R: 1 } },
      },
    ],
  },
  {
    id: "mood",
    title: "Which picture speaks to you?",
    subtitle: "Go with your gut.",
    max: 1,
    card: { kind: "pick" },
    options: [
      { id: "cozy", label: "Cozy & cute", art: ART.valleyQuestcaller, effect: { colorLean: { G: 1, W: 1 } } },
      { id: "spooky", label: "Dark & spooky", art: ART.gisaAndGeralf, effect: { colorLean: { B: 2 } } },
      { id: "radiant", label: "Epic & radiant", art: ART.akroma, effect: { colorLean: { W: 2 } } },
      { id: "fiery", label: "Fire & fury", art: ART.infernoTitan, effect: { colorLean: { R: 2 } } },
      { id: "arcane", label: "Mysterious & arcane", art: ART.hullbreakerHorror, effect: { colorLean: { U: 2 } } },
      { id: "nature", label: "Wild nature", art: ART.nissa, effect: { colorLean: { G: 2 } } },
    ],
  },
  {
    id: "decide",
    title: "How do you make decisions?",
    max: 1,
    card: { kind: "versus", left: "plan", right: "instinct" },
    options: [
      { id: "plan", label: "Plan everything", description: "Think it through, then act.", art: ART.ponder, effect: { colorLean: { U: 2 } } },
      { id: "instinct", label: "Act on instinct", description: "Follow your gut and go.", art: ART.goblinGuide, effect: { colorLean: { R: 2 } } },
    ],
  },
  {
    id: "matters",
    title: "What matters more to you?",
    max: 1,
    card: { kind: "versus", left: "together", right: "alone" },
    options: [
      {
        id: "together",
        label: "Stand together",
        description: "Fair rules keep everyone safe.",
        art: ART.secureTheWastes,
        effect: { colorLean: { W: 2, G: 0.5 } },
      },
      {
        id: "alone",
        label: "Go your own way",
        description: "Nobody tells you what to do.",
        art: ART.direFleetCaptain,
        effect: { colorLean: { B: 1.5, R: 1 } },
      },
    ],
  },
  {
    id: "world",
    title: "What would you do with the world?",
    max: 1,
    card: { kind: "versus", left: "grow", right: "reshape" },
    options: [
      { id: "grow", label: "Let it grow", description: "Nature knows best. Help it thrive.", art: ART.kodamasReach, effect: { colorLean: { G: 2 } } },
      {
        id: "reshape",
        label: "Reshape it",
        description: "Make it work the way you want.",
        art: ART.academyManufactor,
        effect: { colorLean: { U: 0.5, B: 1 } },
      },
    ],
  },
  {
    id: COUNT_QUESTION,
    title: "How many colors?",
    max: 1,
    card: { kind: "versus", left: "one", right: "mix" },
    options: [
      { id: "one", label: "One color, focused", description: "Simple mana and a clear plan.", art: ART.forest, effect: {} },
      { id: "mix", label: "A mix of two or three", description: "More cards to choose from.", art: ART.commandTower, effect: {} },
    ],
  },
];

/** A third color joins a mix when it has at least this share of the second color's lean. */
export const THIRD_COLOR_SHARE = 0.75;

/** How strongly the answers lean toward each color; negative values lean away. */
export function colorLeanOf(answers: Answers, questions: readonly Question[] = COLOR_QUESTIONS): Record<Color, number> {
  const lean: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const question of questions) {
    for (const id of answers[question.id] ?? []) {
      const effect = question.options.find((o) => o.id === id)?.effect;
      for (const [color, weight] of Object.entries(effect?.colorLean ?? {}) as [Color, number][]) lean[color] += weight;
    }
  }
  return lean;
}

/**
 * The quiz result: one color, or two or three for a mix, in WUBRG order. Colors are ranked by their lean, ties in
 * WUBRG order, so the same answers always give the same result. Without an answer to the last card, a mix is assumed.
 */
export function colorQuizResult(answers: Answers): Color[] {
  const lean = colorLeanOf(answers);
  const ranked = [...COLORS].sort((a, b) => lean[b] - lean[a] || COLORS.indexOf(a) - COLORS.indexOf(b));
  if (answers[COUNT_QUESTION]?.includes("one")) return [ranked[0]];
  const [first, second, third] = ranked;
  const withThird = lean[third] > 0 && lean[second] > 0 && lean[third] >= lean[second] * THIRD_COLOR_SHARE;
  return sortColors(withThird ? [first, second, third] : [first, second]);
}

/** "black and green", "white, blue and green". */
export function colorList(colors: readonly Color[]): string {
  const names = sortColors(colors).map((c) => COLOR_NAMES[c].toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
}

/** One plain sentence on what the combination's name means. */
export function combinationSentence(colors: readonly Color[]): string {
  const name = identityName(colors);
  if (colors.length === 1) return `${name} means a deck with only ${colorList(colors)} cards.`;
  const list = colorList(colors);
  return `${list[0].toUpperCase()}${list.slice(1)} together are called ${name}.`;
}

/** The anchor of a color combination on /learn/color-combinations: its name lower-cased, e.g. "golgari", "mono-black". */
export function combinationAnchor(colors: readonly Color[]): string {
  return identityName(colors).toLowerCase();
}

export function combinationHref(colors: readonly Color[]): string {
  return `/learn/color-combinations#${combinationAnchor(colors)}`;
}

/** The precon list filtered to these colors, e.g. "/precons?colors=bg". */
export function preconsHref(colors: readonly Color[]): string {
  return `/precons?colors=${identityKey(colors).toLowerCase()}`;
}

/** A run of text in which some words link to their glossary entry. */
export type GlossaryText = readonly (string | { term: GlossaryTermId; text: string })[];

export interface ColorPieEntry {
  /** A few lower-case words for a one-line overview, after the color's name. */
  short: string;
  /** What the color values, after Wizards of the Coast's own descriptions of the color pie. */
  values: string;
  /** What the color tends to do in a game. */
  games: GlossaryText;
}

export const COLOR_PIE: Record<Color, ColorPieEntry> = {
  W: {
    short: "order, community and protecting others.",
    values: "White values order, community and fairness. It believes rules and working together keep everyone safe.",
    games: [
      "In games it fields many small creatures, gains life and has the most ",
      { term: "board-wipe", text: "board wipes" },
      ", cards that destroy every creature at once.",
    ],
  },
  U: {
    short: "knowledge, perfection and careful planning.",
    values: "Blue values knowledge and perfection. It believes anything can be made better with enough study and planning.",
    games: [
      "In games it ",
      { term: "card-draw", text: "draws extra cards" },
      " and uses counterspells, which stop another player's spell before it happens.",
    ],
  },
  B: {
    short: "ambition and power, whatever the cost.",
    values: "Black values ambition and power. It looks out for itself and will pay almost any price to get ahead, even its own life.",
    games: [
      "In games it ",
      { term: "removal", text: "destroys creatures" },
      ", brings them back from the graveyard (the discard pile) and pays life to draw more cards.",
    ],
  },
  R: {
    short: "freedom, emotion and acting in the moment.",
    values: "Red values freedom and emotion. It acts on how it feels in the moment and hates being held back.",
    games: ["In games it attacks early and deals damage directly to players and creatures."],
  },
  G: {
    short: "growth, nature and instinct.",
    values: "Green values growth, nature and instinct. It accepts the world as it is and trusts what comes naturally.",
    games: [
      "In games it puts extra lands into play to get more mana, called ",
      { term: "ramp", text: "ramp" },
      ", and casts the biggest creatures.",
    ],
  },
};
