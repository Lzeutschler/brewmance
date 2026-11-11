import { fetchPreconList, resolveCardNames } from "@/lib/data/client";
import type { Deck } from "@/lib/decks/types";
import { useDeckStore } from "@/stores/decks";

import { preconCardNames, preconDeck } from "./deck";

/**
 * A saved copy of the precon that was never changed, which opens again instead of piling up duplicates.
 * Call it only once the decks have hydrated (`useDecksHydrated`), or it misses saved copies.
 */
export function untouchedPreconDeck(id: string): Deck | undefined {
  return Object.values(useDeckStore.getState().decks).find((d) => d.precon?.id === id && d.updatedAt === d.createdAt);
}

/**
 * The deck id of the precon `id` (an id from the precon list, never user input): an untouched saved copy,
 * or a new deck saved from its list. `missing` names the cards left out because the card database does not
 * know them. Throws when the list cannot be loaded or its commander is unknown. Browser only.
 */
export async function ensurePreconDeck(id: string): Promise<{ deckId: string; missing: string[]; name: string }> {
  const untouched = untouchedPreconDeck(id);
  if (untouched) return { deckId: untouched.id, missing: [], name: untouched.name };

  const list = await fetchPreconList(id);
  const { cards } = await resolveCardNames(preconCardNames(list));
  const deck = preconDeck(list, cards);
  if (!deck) throw new Error(`Could not find the commander of ${list.name}`);
  const { missing, ...input } = deck;
  const deckId = useDeckStore.getState().createDeck(input);
  return { deckId, missing, name: deck.name };
}

/** The warning shown when a precon was saved without some of its cards. */
export function missingCardsMessage(missing: readonly string[]): string {
  return `Left out ${missing.length} card(s) that are not Commander-legal: ${missing.slice(0, 3).join(", ")}`;
}
