import { describe, expect, it } from "vitest";

import { condensePrecon, dropEditions, type MtgjsonDeck } from "./format";

function mtgjsonDeck(overrides: Partial<MtgjsonDeck> = {}): MtgjsonDeck {
  return {
    name: "Virtue and Valor",
    code: "WOC",
    releaseDate: "2023-09-08",
    type: "Commander Deck",
    commander: [{ name: "Ellivere of the Wild Court", count: 1 }],
    mainBoard: [
      { name: "Sol Ring", count: 1 },
      { name: "Forest", count: 49 },
      { name: "Plains", count: 30 },
      // The same card in a second printing.
      { name: "Plains", count: 19 },
    ],
    ...overrides,
  };
}

describe("condensePrecon", () => {
  it("keeps names and counts and merges printings of the same card", () => {
    expect(condensePrecon("VirtueAndValor_WOC", mtgjsonDeck())).toEqual({
      id: "VirtueAndValor_WOC",
      name: "Virtue and Valor",
      set: "WOC",
      releaseDate: "2023-09-08",
      commanders: ["Ellivere of the Wild Court"],
      cards: [
        ["Forest", 49],
        ["Plains", 49],
        ["Sol Ring", 1],
      ],
    });
  });

  it("counts a pair of commanders towards the 100 cards", () => {
    const pair = mtgjsonDeck({
      commander: [
        { name: "The Tenth Doctor", count: 1 },
        { name: "Rose Tyler", count: 1 },
      ],
      mainBoard: [{ name: "Island", count: 98 }],
    });
    expect(condensePrecon("TimeyWimey_WHO", pair)?.commanders).toEqual(["The Tenth Doctor", "Rose Tyler"]);
  });

  it("rejects decks that are no complete Commander deck", () => {
    expect(condensePrecon("x", mtgjsonDeck({ type: "Theme Deck" }))).toBeNull();
    expect(condensePrecon("x", mtgjsonDeck({ commander: [] }))).toBeNull();
    expect(condensePrecon("x", mtgjsonDeck({ mainBoard: [{ name: "Forest", count: 60 }] }))).toBeNull();
  });
});

describe("dropEditions", () => {
  const deck = (name: string, releaseDate: string, commanders = ["Cloud, Ex-SOLDIER"]) => ({ name, releaseDate, commanders });

  it("keeps the regular edition instead of the Collector's Edition", () => {
    const decks = [deck("Limit Break Collector's Edition (FINAL FANTASY VII)", "2025-06-13"), deck("Limit Break (FINAL FANTASY VII)", "2025-06-13")];
    expect(dropEditions(decks)).toEqual([deck("Limit Break (FINAL FANTASY VII)", "2025-06-13")]);
  });

  it("gives a lone Collector's Edition the deck's plain name", () => {
    expect(dropEditions([deck("Forces of the Imperium Collector's Edition", "2022-10-07")])).toEqual([deck("Forces of the Imperium", "2022-10-07")]);
  });

  it("keeps the first release of a reprinted deck but not of a different deck with the same name", () => {
    const decks = [
      deck("Heavenly Inferno", "2017-06-09", ["Kaalia of the Vast"]),
      deck("Heavenly Inferno", "2011-06-17", ["Kaalia of the Vast"]),
      deck("Heavenly Inferno", "2030-01-01", ["Someone Else"]),
    ];
    expect(dropEditions(decks).map((d) => d.releaseDate)).toEqual(["2011-06-17", "2030-01-01"]);
  });
});
