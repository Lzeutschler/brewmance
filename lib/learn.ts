/**
 * The guides for new players under /learn: one registry for the hub, the page metadata, the breadcrumbs,
 * the "more guides" links, the sitemap and the structured data.
 */

export const LEARN_UPDATED = "2026-11-11";

export type LearnPath =
  | "/learn"
  | "/learn/how-to-play-commander"
  | "/learn/how-to-build-a-commander-deck"
  | "/learn/how-many-lands"
  | "/learn/color-combinations"
  | "/learn/brackets"
  | "/learn/glossary";

export interface LearnPage {
  path: LearnPath;
  title: string;
  /** For the hub and the meta description; at most 155 characters. */
  description: string;
  /** ISO date of the last real change to the page. */
  updated: string;
  /** Position on the hub and in link lists; the hub itself is 0. */
  order: number;
}

export const LEARN_HUB: LearnPage = {
  path: "/learn",
  title: "New to Commander? Start here",
  description:
    "New to Commander? Learn how the format works, how a deck comes together and what the common words mean, then try it with a real deck.",
  updated: LEARN_UPDATED,
  order: 0,
};

/** The hub first, then the guides in reading order. */
export const LEARN_PAGES: readonly LearnPage[] = [
  LEARN_HUB,
  {
    path: "/learn/how-to-play-commander",
    title: "How to play Commander",
    description:
      "The rules that make Commander different: 100-card decks, one copy of each card, a commander in the command zone and 40 life.",
    updated: LEARN_UPDATED,
    order: 1,
  },
  {
    path: "/learn/how-to-build-a-commander-deck",
    title: "How to build a Commander deck",
    description:
      "Build a Commander deck step by step: pick a commander, count your lands, then add ramp, card draw, removal and a way to win.",
    updated: LEARN_UPDATED,
    order: 2,
  },
  {
    path: "/learn/how-many-lands",
    title: "How many lands in a Commander deck?",
    description:
      "How many lands your Commander deck needs, how your mana curve and ramp change that number, and a table to look it up.",
    updated: LEARN_UPDATED,
    order: 3,
  },
  {
    path: "/learn/color-combinations",
    title: "Magic color combinations and their names",
    description:
      "What Azorius, Golgari, Esper and the other color names mean, with the mana symbols for every two-, three-, four- and five-color group.",
    updated: LEARN_UPDATED,
    order: 4,
  },
  {
    path: "/learn/brackets",
    title: "Commander brackets explained",
    description:
      "Commander brackets rate how strong a deck is, from 1 to 5. What each bracket allows, what Game Changers are and where a precon fits.",
    updated: LEARN_UPDATED,
    order: 5,
  },
  {
    path: "/learn/glossary",
    title: "Commander glossary",
    description:
      "Short explanations of the words you hear at a Commander table, from command zone and commander tax to ramp, tutors and goldfishing.",
    updated: LEARN_UPDATED,
    order: 6,
  },
];

/** The guides without the hub, in reading order. */
export const LEARN_GUIDES: readonly LearnPage[] = LEARN_PAGES.filter((page) => page.path !== LEARN_HUB.path);

export function learnPage(path: LearnPath): LearnPage {
  const page = LEARN_PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`Unknown learn page: ${path}`);
  return page;
}

/** Anchors on /learn/glossary. Link to them with `glossaryHref` or the `Term` component. */
export const GLOSSARY_TERM_IDS = [
  "commander",
  "command-zone",
  "edh",
  "singleton",
  "color-identity",
  "commander-tax",
  "commander-damage",
  "precon",
  "bracket",
  "game-changer",
  "ramp",
  "card-draw",
  "interaction",
  "removal",
  "board-wipe",
  "protection",
  "finisher",
  "mana-value",
  "mana-curve",
  "tutor",
  "combo",
  "staple",
  "token",
  "mulligan",
  "goldfish",
] as const;

export type GlossaryTermId = (typeof GLOSSARY_TERM_IDS)[number];

export function glossaryHref(id: GlossaryTermId): string {
  return `/learn/glossary#${id}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-11-11" → "November 11, 2026", without touching the clock or the server's time zone. */
export function formatLearnDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Not an ISO date: ${iso}`);
  const [, year, month, day] = match;
  const name = MONTHS[Number(month) - 1];
  if (!name) throw new Error(`Not an ISO date: ${iso}`);
  return `${name} ${Number(day)}, ${year}`;
}
