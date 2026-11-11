import type { CardImage } from "@/lib/cards/types";
import type { GlossaryTermId } from "@/lib/learn";

/**
 * The entries of /learn/glossary. Plain text only: the page renders mana symbols written as `{2}{G}`, and the same
 * text goes into the DefinedTermSet JSON-LD. Rules checked on 2026-11-11 against Wizards' Commander format page, the
 * Comprehensive Rules of 2026-11-06 and the Commander brackets update of 2026-02-09.
 */

export type GlossaryGroupId = "format" | "deck" | "table";

export interface GlossaryGroup {
  id: GlossaryGroupId;
  title: string;
}

/** Page order: how the format works, then building a deck, then playing a game. */
export const GLOSSARY_GROUPS: readonly GlossaryGroup[] = [
  { id: "format", title: "The format" },
  { id: "deck", title: "Building a deck" },
  { id: "table", title: "At the table" },
];

export interface GlossaryExample {
  name: string;
  /** Scryfall image as stored in data/cards.json. */
  image: CardImage;
}

export interface GlossaryEntry {
  id: GlossaryTermId;
  term: string;
  /** Other names for the same thing. */
  aka?: string;
  group: GlossaryGroupId;
  /** One to three sentences, plain text; `{G}`-style mana symbols allowed. */
  text: string;
  /** A well-known card that shows the idea. */
  example?: GlossaryExample;
  /** A page that goes deeper. */
  more?: { href: string; label: string };
}

/** Example cards, image objects copied from data/cards.json (checked by learn-glossary.test.ts when the data exists). */
export const GLOSSARY_EXAMPLES = {
  solRing: {
    name: "Sol Ring",
    image: { key: "f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f", version: "1793021181", doubleFaced: false },
  },
  rhysticStudy: {
    name: "Rhystic Study",
    image: { key: "9/f/9f37c5b6-a59c-45cd-9a99-e9357fe9ea1b", version: "1783919146", doubleFaced: false },
  },
  counterspell: {
    name: "Counterspell",
    image: { key: "4/f/4f616706-ec97-4923-bb1e-11a69fbaa1f8", version: "1783909630", doubleFaced: false },
  },
  swordsToPlowshares: {
    name: "Swords to Plowshares",
    image: { key: "4/6/4645eebf-c9fc-4ee7-b646-61dc1205b4b0", version: "1793111861", doubleFaced: false },
  },
  wrathOfGod: {
    name: "Wrath of God",
    image: { key: "1/e/1eac116d-bc78-4585-8b97-2775c3d0bdb4", version: "1793281330", doubleFaced: false },
  },
  lightningGreaves: {
    name: "Lightning Greaves",
    image: { key: "6/5/659ef698-96ea-4fa9-b63c-0da93a2d1e78", version: "1793197566", doubleFaced: false },
  },
  craterhoofBehemoth: {
    name: "Craterhoof Behemoth",
    image: { key: "2/7/276f5cee-a501-4658-bd4d-7a044bf1ccbc", version: "1783907345", doubleFaced: false },
  },
  demonicTutor: {
    name: "Demonic Tutor",
    image: { key: "a/2/a24b4cb6-cebb-428b-8654-74347a6a8d63", version: "1783915679", doubleFaced: false },
  },
  arcaneSignet: {
    name: "Arcane Signet",
    image: { key: "7/9/795df2ee-fbfc-4961-852c-e3ec50cc52da", version: "1793021117", doubleFaced: false },
  },
} as const satisfies Record<string, GlossaryExample>;

export const GLOSSARY: readonly GlossaryEntry[] = [
  // The format
  {
    id: "edh",
    term: "EDH",
    group: "format",
    text: "Short for Elder Dragon Highlander, the original name of Commander. Both names mean the same format.",
  },
  {
    id: "commander",
    term: "Commander",
    group: "format",
    text:
      "The legendary creature that leads your deck. It decides which colors your deck may use and starts the game in the command zone. A few other legendary cards, such as Vehicles, can be commanders too.",
  },
  {
    id: "command-zone",
    term: "Command zone",
    group: "format",
    text:
      "A space next to the battlefield where your commander starts the game. You can cast your commander from there whenever you could cast it from your hand, and it can go back there when it dies or is exiled.",
  },
  {
    id: "singleton",
    term: "Singleton",
    group: "format",
    text:
      "Your deck may hold only one copy of each card. Basic lands such as Forest or Island are the exception, along with the few cards that say a deck can have any number of them.",
  },
  {
    id: "color-identity",
    term: "Color identity",
    group: "format",
    text:
      "Every color in a card's mana cost and in the mana symbols of its rules text. Each card in your deck must fit inside your commander's color identity, and colorless cards fit every deck. A hybrid symbol such as {R/G} counts as both colors.",
    more: { href: "/learn/color-combinations", label: "Color combinations and their names" },
  },
  {
    id: "commander-tax",
    term: "Commander tax",
    group: "format",
    text:
      "Casting your commander from the command zone costs {2} more for each earlier time you cast it from there this game. The second cast costs {2} extra, the third {4} extra.",
  },
  {
    id: "commander-damage",
    term: "Commander damage",
    group: "format",
    text:
      "A player who takes 21 or more combat damage from the same commander over the game loses, even with life left. Each commander is counted on its own.",
  },
  {
    id: "precon",
    term: "Precon",
    aka: "preconstructed deck",
    group: "format",
    text:
      "A complete, ready-to-play Commander deck sold as one product. A good first deck, and easy to improve one card at a time.",
    more: { href: "/precons", label: "All Commander precons" },
  },
  {
    id: "bracket",
    term: "Bracket",
    group: "format",
    text:
      "A number from 1 (Exhibition) to 5 (cEDH) that says how strong a deck is meant to be. Players compare brackets before a game so the decks at the table suit each other.",
    more: { href: "/learn/brackets", label: "Commander brackets explained" },
  },
  {
    id: "game-changer",
    term: "Game Changer",
    group: "format",
    text:
      "A card on Wizards' Game Changers list of cards strong enough to swing a game on their own. Decks in brackets 1 and 2 leave them out, bracket 3 allows up to three, and brackets 4 and 5 have no limit.",
    more: { href: "/learn/brackets", label: "Commander brackets explained" },
  },

  // Building a deck
  {
    id: "mana-value",
    term: "Mana value",
    aka: "converted mana cost, CMC",
    group: "deck",
    text:
      "The total amount of mana in a card's cost, colored symbols included: {2}{G} has a mana value of 3. Lands have a mana value of 0.",
  },
  {
    id: "mana-curve",
    term: "Mana curve",
    aka: "curve",
    group: "deck",
    text:
      "How many cards in your deck sit at each mana value. A lower curve lets you act on your early turns, and a higher one needs more lands and ramp.",
    more: { href: "/learn/how-many-lands", label: "How many lands in a Commander deck?" },
  },
  {
    id: "ramp",
    term: "Ramp",
    group: "deck",
    text: "Cards that give you extra mana or extra lands, so you can cast bigger spells sooner.",
    example: GLOSSARY_EXAMPLES.solRing,
  },
  {
    id: "card-draw",
    term: "Card draw",
    aka: "draw",
    group: "deck",
    text: "Cards that let you draw more than the one card per turn, so you don't run out of things to do.",
    example: GLOSSARY_EXAMPLES.rhysticStudy,
  },
  {
    id: "interaction",
    term: "Interaction",
    group: "deck",
    text:
      "Anything that stops or answers what an opponent is doing. Removal, board wipes and counterspells, which stop a spell before it takes effect, all count.",
    example: GLOSSARY_EXAMPLES.counterspell,
  },
  {
    id: "removal",
    term: "Removal",
    group: "deck",
    text:
      "A card that deals with one threat, such as a creature or an artifact, by destroying it, exiling it or sending it back to its owner's hand.",
    example: GLOSSARY_EXAMPLES.swordsToPlowshares,
  },
  {
    id: "board-wipe",
    term: "Board wipe",
    aka: "wrath, sweeper",
    group: "deck",
    text: "A card that removes many things at once, often every creature on the battlefield, yours included.",
    example: GLOSSARY_EXAMPLES.wrathOfGod,
  },
  {
    id: "protection",
    term: "Protection",
    group: "deck",
    text:
      "Cards that keep your commander or other key cards safe from removal, for example by stopping opponents from targeting them.",
    example: GLOSSARY_EXAMPLES.lightningGreaves,
  },
  {
    id: "finisher",
    term: "Finisher",
    aka: "win condition, wincon",
    group: "deck",
    text:
      "A card that ends the game once you have creatures on the battlefield, often by making all of them much stronger at once.",
    example: GLOSSARY_EXAMPLES.craterhoofBehemoth,
  },
  {
    id: "tutor",
    term: "Tutor",
    group: "deck",
    text:
      "A card that lets you search your library, your draw pile, for another card. The name comes from Demonic Tutor.",
    example: GLOSSARY_EXAMPLES.demonicTutor,
  },
  {
    id: "combo",
    term: "Combo",
    group: "deck",
    text:
      "Two or more cards that together win the game or repeat an effect as often as you like. Lower brackets limit infinite combos made of just two cards.",
    more: { href: "/learn/brackets", label: "Commander brackets explained" },
  },
  {
    id: "staple",
    term: "Staple",
    group: "deck",
    text: "A card that shows up in many decks because it is good in almost any of them, like Sol Ring or Arcane Signet.",
    example: GLOSSARY_EXAMPLES.arcaneSignet,
  },

  // At the table
  {
    id: "token",
    term: "Token",
    group: "table",
    text:
      "A creature or other object that a card puts onto the battlefield, such as a 1/1 Soldier. Tokens are not cards: when one leaves the battlefield, it disappears.",
  },
  {
    id: "mulligan",
    term: "Mulligan",
    group: "table",
    text:
      "Shuffling your opening hand back into your library to draw seven new cards. You then put one card on the bottom of your library for each mulligan, but in multiplayer games your first mulligan is free.",
  },
  {
    id: "goldfish",
    term: "Goldfish",
    aka: "goldfishing",
    group: "table",
    text:
      "Playing your deck alone, with no opponent, to see how it draws and how fast it gets going. The name comes from playing against a goldfish that never does anything back.",
    more: { href: "/goldfish", label: "Goldfish a deck" },
  },
];

export function glossaryEntries(group: GlossaryGroupId): GlossaryEntry[] {
  return GLOSSARY.filter((entry) => entry.group === group);
}

/** Splits text into plain runs and runs of mana symbols such as "{2}{G}", for rendering with ManaCost. */
export function splitManaText(text: string): { text: string; mana: boolean }[] {
  return text
    .split(/((?:\{[^}\s]+\})+)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, mana: part.startsWith("{") }));
}
