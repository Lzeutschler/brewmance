import { describe, expect, it } from "vitest";

import type { Card } from "@/lib/cards/types";
import { deckCount } from "@/lib/decks/stats";
import { basic, card } from "@/tests/fixtures";

import { preconCardNames, preconDeck } from "./deck";
import type { PreconList } from "./types";

const legend = (name: string, oracleText = "") => card({ name, typeLine: "Legendary Creature — Human", oracleText });

function resolve(...cards: Card[]): Record<string, Card> {
  return Object.fromEntries(cards.map((c) => [c.name, c]));
}

function list(commanders: string[], cards: PreconList["cards"]): PreconList {
  return { id: "Deck_SET", name: "Deck", set: "SET", releaseDate: "2024-01-01", commanders, cards };
}

describe("preconDeck", () => {
  const solRing = card({ name: "Sol Ring" });
  const forest = basic("Forest", "G");

  it("builds a bracket 2 deck that remembers its precon", () => {
    const ellivere = legend("Ellivere of the Wild Court");
    const precon = list(["Ellivere of the Wild Court"], [["Sol Ring", 1], ["Forest", 98]]);
    const deck = preconDeck(precon, resolve(ellivere, solRing, forest))!;
    expect(deck).toMatchObject({ name: "Deck", bracket: 2, theme: null, precon: { id: "Deck_SET", name: "Deck" }, missing: [] });
    expect(deck.commander).toBe(ellivere);
    expect(deck.partner).toBeUndefined();
    expect(deckCount(deck.entries)).toBe(99);
    expect(preconCardNames(precon)).toEqual(["Ellivere of the Wild Court", "Sol Ring", "Forest"]);
  });

  it("puts two commanders that may pair into the command zone", () => {
    const doctor = card({ name: "The Tenth Doctor", typeLine: "Legendary Creature — Time Lord Doctor" });
    const rose = legend("Rose Tyler", "Doctor's companion (You can have two commanders if the other is the Doctor.)");
    const deck = preconDeck(list(["The Tenth Doctor", "Rose Tyler"], [["Forest", 98]]), resolve(doctor, rose, forest))!;
    expect([deck.commander, deck.partner]).toEqual([doctor, rose]);
    expect(deckCount(deck.entries)).toBe(98);
  });

  it("moves a second commander that cannot pair into the 99", () => {
    const a = legend("First Legend");
    const b = legend("Second Legend");
    const deck = preconDeck(list(["First Legend", "Second Legend"], [["Forest", 98]]), resolve(a, b, forest))!;
    expect(deck.partner).toBeUndefined();
    expect(deck.entries.map((e) => e.card.name)).toContain("Second Legend");
    expect(deckCount(deck.entries)).toBe(99);
  });

  it("reports unknown cards and gives up without the commander", () => {
    const ellivere = legend("Ellivere of the Wild Court");
    const precon = list(["Ellivere of the Wild Court"], [["Banned Card", 1], ["Forest", 98]]);
    expect(preconDeck(precon, resolve(ellivere, forest))!.missing).toEqual(["Banned Card"]);
    expect(preconDeck(precon, resolve(forest))).toBeNull();
  });
});
