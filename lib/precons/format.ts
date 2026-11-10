import type { PreconList } from "./types";

/** The parts of an MTGJSON deck file (mtgjson.com/api/v5/decks/{fileName}.json) the precon list needs. */
export interface MtgjsonDeck {
  name: string;
  code: string;
  releaseDate: string | null;
  type: string;
  commander?: MtgjsonDeckCard[];
  mainBoard?: MtgjsonDeckCard[];
}

interface MtgjsonDeckCard {
  name: string;
  count: number;
}

export const PRECON_DECK_TYPE = "Commander Deck";
const DECK_CARDS = 100;

/**
 * An MTGJSON deck as names and counts, or null when it is no complete Commander deck (one or two
 * commanders and 100 cards in all). The same card in several printings becomes one entry.
 */
export function condensePrecon(id: string, deck: MtgjsonDeck): PreconList | null {
  const commanders = [...new Set((deck.commander ?? []).map((c) => c.name))];
  if (deck.type !== PRECON_DECK_TYPE || commanders.length < 1 || commanders.length > 2) return null;

  const counts = new Map<string, number>();
  for (const card of deck.mainBoard ?? []) counts.set(card.name, (counts.get(card.name) ?? 0) + card.count);
  const total = commanders.length + [...counts.values()].reduce((a, b) => a + b, 0);
  if (total !== DECK_CARDS) return null;

  return {
    id,
    name: deck.name,
    set: deck.code,
    releaseDate: deck.releaseDate ?? "",
    commanders,
    cards: [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}

/** "Limit Break Collector's Edition (FINAL FANTASY VII)" carries it before the game's name. */
const COLLECTORS_EDITION = / Collector's Edition(?= \(|$)/;

/**
 * One entry per deck: a Collector's Edition (same cards, different finish) takes the deck's plain name,
 * and of decks with the same name and commanders, such as Commander Anthology reprints, the first
 * release stays.
 */
export function dropEditions<T extends Pick<PreconList, "name" | "commanders" | "releaseDate">>(decks: T[]): T[] {
  const collectors = (deck: T) => Number(COLLECTORS_EDITION.test(deck.name));
  // Oldest first, and at the same date the regular edition before the Collector's Edition.
  const ordered = [...decks].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || collectors(a) - collectors(b));
  const first = new Map<string, T>();
  for (const deck of ordered) {
    const name = deck.name.replace(COLLECTORS_EDITION, "");
    const key = `${name}|${deck.commanders.join("|")}`;
    if (!first.has(key)) first.set(key, { ...deck, name });
  }
  return [...first.values()];
}
