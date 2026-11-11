import { ARCHETYPE_IDS, ARCHETYPE_LABELS, type ArchetypeId } from "@/lib/tagging/archetypes";

/**
 * What the labels on a precon page mean ("Voltron", "Aristocrats", "Stax"): one entry per deck style in the
 * "Deck styles" part of /learn/glossary. The labels are the archetype labels, so a badge and its entry always
 * read the same. Plain text for someone new to the game; rules wording checked against the Comprehensive Rules
 * of 2026-11-06.
 */

export interface DeckStyle {
  /** Anchor on the glossary page, e.g. "style-voltron". */
  id: string;
  term: string;
  /** One or two sentences, plain text. */
  text: string;
}

const TEXT: Record<ArchetypeId, string> = {
  tokens: "Makes lots of creature tokens and wins with a wide army, often by making all of them bigger at once.",
  aristocrats:
    "Sacrifices its own creatures on purpose and gets something each time one dies, such as draining life from opponents. The name comes from two cards, Falkenrath Aristocrat and Cartel Aristocrat.",
  voltron:
    "Puts Equipment and Auras on one creature, usually the commander, until it is big enough to win through commander damage. Named after the robot that is put together from parts.",
  spellslinger: "Plays few creatures and many instants and sorceries, with cards that reward you for each spell you cast.",
  reanimator: "Uses the graveyard as a resource: it puts cards there on purpose and brings creatures back from it to the battlefield.",
  lands: "Gets a bonus whenever a land enters under your control, an ability called landfall, and looks for ways to play more than one land a turn.",
  counters: "Puts +1/+1 counters on its creatures so they grow over the game. Each counter makes a creature one bigger for as long as it stays.",
  blink:
    "Exiles its own creatures and returns them right away, so abilities that happen when a creature enters the battlefield (ETB for short) happen again.",
  control: "Stops what opponents do with counterspells and removal, and wins late with a few strong cards.",
  stax: "Slows the whole table down with cards that tax or restrict what players can do, while the deck itself is built to work around them. Not every table enjoys playing against it.",
  grouphug: "Gives every player extra cards, mana or other gifts, and uses deals and goodwill to stay out of trouble.",
  goad: "Forces opponents' creatures to fight each other. A goaded creature has to attack each combat if it can, and has to attack someone other than the player who goaded it if it can.",
  typal:
    "Built around one creature type, such as Elves, Dragons or Zombies, with cards that make every creature of that type better. Many players still call it tribal.",
  artifacts: "Built around artifacts, with cards that make them cheaper, bring them back or count how many you control.",
  enchantress:
    "Plays many enchantments and draws a card or gets another bonus each time it casts one. Named after the Enchantress creatures that do this.",
  lifegain: "Gains life often and has cards that turn each bit of life gained into something else, such as bigger creatures or damage.",
  combo:
    "Collects a few specific cards that win the game together, often in a single turn. Storm is a version that casts many cheap spells in one turn.",
  ramp: "Plays extra lands and other mana cards early to cast very expensive spells long before the rest of the table can.",
  stompy: "Wins with big creatures and with cards that reward you for having them.",
  mill: "Puts cards from opponents' libraries (their decks) straight into their graveyards. A player who has to draw from an empty library loses the game.",
  wheels:
    "Makes every player discard their hand and draw a new one, called a wheel after the card Wheel of Fortune, and has cards that reward or punish all that drawing and discarding.",
  superfriends:
    "Built around planeswalkers, powerful allies that stay on the battlefield and do something each turn. The deck protects them and makes them stronger.",
  chaos: "Uses coin flips, dice and random effects, so nobody at the table knows what happens next.",
  theft: "Takes control of opponents' creatures and spells and wins with their cards.",
  aggro: "Attacks from the first turns and keeps the pressure up, sometimes with extra combat phases in the same turn.",
  burn: "Deals damage straight to players or drains life from all opponents at once, instead of winning through combat.",
  treasure:
    "Makes Treasure tokens, artifacts you can sacrifice for one mana of any color, and gets bonuses for making or using them.",
  vehicles: "Built around Vehicles, artifacts that become creatures for a turn when your other creatures crew them.",
};

const anchor = (id: string) => `style-${id}`;

/** The styles that are not archetypes of their own but can still show as a label. */
const EXTRA: readonly DeckStyle[] = [
  {
    id: anchor("flyers"),
    term: "Flyers",
    text: "Built around creatures with flying, which can only be blocked by creatures with flying or reach.",
  },
];

/** Every deck style, A to Z by its label. */
export const DECK_STYLES: readonly DeckStyle[] = [
  ...ARCHETYPE_IDS.map((id) => ({ id: anchor(id), term: ARCHETYPE_LABELS[id], text: TEXT[id] })),
  ...EXTRA,
].sort((a, b) => a.term.replace(/^\W+/, "").localeCompare(b.term.replace(/^\W+/, "")));

const BY_ANCHOR = new Map(DECK_STYLES.map((style) => [style.id, style]));

/** Theme ids of lib/tagging/themes.ts that mean the same as an archetype. */
const THEME_STYLE: Record<string, ArchetypeId | "flyers"> = {
  graveyard: "reanimator",
  enchantments: "enchantress",
  sacrifice: "aristocrats",
  landfall: "lands",
  combat: "aggro",
  politics: "grouphug",
  discard: "wheels",
  flyers: "flyers",
};

/** Theme ids explained by a term of the main glossary instead. */
const THEME_TERM: Record<string, string> = { draw: "card-draw" };

export interface DeckStyleLink {
  href: string;
  /** The explanation, for a tooltip. */
  text: string | null;
}

/** Where a precon's theme or archetype label is explained, or null when the glossary has nothing on it. */
export function deckStyleLink(id: string): DeckStyleLink | null {
  const term = THEME_TERM[id];
  if (term) return { href: `/learn/glossary#${term}`, text: null };
  const style = BY_ANCHOR.get(anchor(THEME_STYLE[id] ?? id));
  return style ? { href: `/learn/glossary#${style.id}`, text: style.text } : null;
}
