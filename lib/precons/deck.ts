import { asPairable, canPair, isBackground } from "@/lib/cards/pairing";
import type { Card } from "@/lib/cards/types";
import type { Deck, DeckEntry } from "@/lib/decks/types";

import type { PreconList } from "./types";

/** Precons are built for the Core bracket. */
export const PRECON_BRACKET = 2;

export type PreconDeck = Pick<Deck, "name" | "commander" | "partner" | "bracket" | "theme" | "entries" | "precon"> & {
  /** Card names the card database does not know, e.g. cards banned since the deck came out. */
  missing: string[];
};

/**
 * A precon list as a deck, with `cards` as resolved by name. Two listed commanders share the command
 * zone when the rules allow it; otherwise the second one joins the 99. Null without the commander.
 */
export function preconDeck(list: PreconList, cards: Record<string, Card>): PreconDeck | null {
  const [first, second] = list.commanders.map((name) => cards[name]);
  if (!first) return null;
  const pair = second && canPair(asPairable(first), asPairable(second)) ? second : undefined;
  // A Background always goes second.
  const [commander, partner] = pair && isBackground(asPairable(first)) ? [pair, first] : [first, pair];

  const entries = new Map<string, DeckEntry>();
  const missing: string[] = [];
  const add = (card: Card, quantity: number) => entries.set(card.id, { card, quantity: (entries.get(card.id)?.quantity ?? 0) + quantity });
  if (second && !pair) add(second, 1);
  for (const [name, quantity] of list.cards) {
    const card = cards[name];
    if (card) add(card, quantity);
    else missing.push(name);
  }

  return {
    name: list.name,
    commander,
    ...(partner && { partner }),
    bracket: PRECON_BRACKET,
    theme: null,
    entries: [...entries.values()],
    precon: { id: list.id, name: list.name },
    missing,
  };
}

/** Every name of the list, to look the cards up with. */
export function preconCardNames(list: PreconList): string[] {
  return [...list.commanders, ...list.cards.map(([name]) => name)];
}
