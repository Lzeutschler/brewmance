/** A line in the voice of a card's flavor text, with whoever is supposed to have said it. */
export interface FlavorLine {
  text: string;
  by?: string;
}

/**
 * Flavor text for the few moments where something is finished or nothing is there yet. Written for
 * this site, in the tone of the game's own flavor text, never quoted from a card.
 */
export const FLAVOR = {
  /** A deck is swiped together. */
  brewed: [
    { text: "Ninety-nine cards went in. One deck came out.", by: "Kitchen-table proverb" },
    { text: "Stir twice, shuffle well, cut for luck.", by: "Old brewer's rule" },
    { text: "Every commander deserves ninety-nine friends." },
    { text: "The first game will teach it more than the last ten swipes did.", by: "Old brewer's rule" },
  ],
  /** An upgrade ends with swaps made. */
  upgraded: [
    { text: "It's not you, it's the mana curve.", by: "Said to many a six-drop" },
    { text: "Same deck. It just listens better now." },
    { text: "Some cards were always meant for the binder.", by: "Old brewer's rule" },
    { text: "A good swap is felt on turn three, not on the receipt.", by: "Kitchen-table proverb" },
  ],
  /** An upgrade finds nothing worth swapping. */
  settled: [{ text: "Some couples just work." }, { text: "Leave a good brew alone.", by: "Old brewer's rule" }],
  /** No decks, or no cards in a deck. */
  empty: [
    { text: "An empty cauldron is only a promise.", by: "Old brewer's rule" },
    { text: "Every brew starts with one card and a questionable idea." },
  ],
} satisfies Record<string, FlavorLine[]>;

/** The same line for the same seed (a deck id, say), so a moment keeps its line while it is on screen. */
export function pickFlavor(lines: readonly FlavorLine[], seed: string): FlavorLine {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return lines[hash % lines.length];
}
