import { describe, expect, it } from "vitest";

import type { Card } from "@/lib/cards/types";
import { karstenLands } from "@/lib/deckbuilder/template";
import { basic, card, land, spell } from "@/tests/fixtures";

import { ANALYSIS_ROLES, analyzePrecon } from "./analysis";
import { preconDeck, type PreconDeck } from "./deck";
import type { PreconList } from "./types";

const commander = card({
  name: "Krenko, Mob Boss",
  manaCost: "{2}{R}{R}",
  cmc: 4,
  typeLine: "Legendary Creature — Goblin Warrior",
  colorIdentity: ["R"],
});

/** A precon from `cards` (name → card), with the commander first. */
function build(cards: Card[], counts: Record<string, number> = {}, extra: Partial<PreconList> = {}): PreconDeck {
  const list: PreconList = {
    id: "Test_TST",
    name: "Test Deck",
    set: "TST",
    releaseDate: "2025-01-01",
    commanders: [commander.name],
    cards: cards.map((c) => [c.name, counts[c.name] ?? 1]),
    ...extra,
  };
  const byName = Object.fromEntries([commander, ...cards].map((c) => [c.name, c]));
  const deck = preconDeck(list, byName);
  if (!deck) throw new Error("commander did not resolve");
  return deck;
}

/** A full 99: 37 Mountains, 10 ramp, 4 draw, 8 interaction, 1 wipe, 6 protection and filler. */
function fullDeck(): PreconDeck {
  const cards: Card[] = [basic("Mountain", "R")];
  const counts: Record<string, number> = { Mountain: 37 };
  const add = (prefix: string, n: number, cmc: number, roles: Parameters<typeof spell>[2]) => {
    for (let i = 0; i < n; i += 1) cards.push(spell(`${prefix} ${i}`, cmc, roles));
  };
  add("Ramp", 10, 2, ["ramp"]);
  add("Draw", 4, 3, ["draw"]);
  add("Removal", 8, 2, ["removal"]);
  add("Wipe", 1, 5, ["boardwipe"]);
  add("Shield", 6, 1, ["protection"]);
  add("Filler", 33, 4, []);
  return build(cards, counts);
}

describe("analyzePrecon", () => {
  it("counts the deck and its curve", () => {
    const analysis = analyzePrecon(fullDeck());
    expect(analysis.deckSize).toBe(100);
    expect(analysis.mainDeck).toBe(99);
    expect(analysis.mainDeckTarget).toBe(99);
    expect(analysis.lands).toBe(37);
    expect(analysis.nonlands).toBe(62);
    expect(analysis.curve).toEqual([6, 18, 4, 33, 1, 0]);
    expect(analysis.curveLabels).toHaveLength(6);
    expect(analysis.averageManaValue).toBe(Math.round(((6 * 1 + 18 * 2 + 4 * 3 + 33 * 4 + 5) / 62) * 100) / 100);
  });

  it("compares roles with the Core targets, without finishers", () => {
    const analysis = analyzePrecon(fullDeck());
    expect(analysis.roles.map((r) => r.role)).toEqual([...ANALYSIS_ROLES]);
    expect(analysis.roles.find((r) => r.role === "ramp")).toMatchObject({ have: 10, target: 10, label: "Ramp" });
    expect(analysis.thin).toEqual(["draw", "boardwipe"]);
    expect(analysis.plenty).toEqual(["protection"]);
  });

  it("suggests lands with Karsten's formula", () => {
    const analysis = analyzePrecon(fullDeck());
    const avg = (6 * 1 + 18 * 2 + 4 * 3 + 33 * 4 + 5) / 62;
    // Cheap ramp and draw: the 10 two-mana ramp spells.
    expect(analysis.cheapRampDraw).toBe(10);
    expect(analysis.landAdvice).toEqual({ have: 37, karsten: Math.round(karstenLands(avg, 10)), typical: 37 });
  });

  it("gives no Karsten suggestion for a deck too small to tell", () => {
    const analysis = analyzePrecon(build([spell("Lone Bolt", 1, ["removal"])]));
    expect(analysis.landAdvice.karsten).toBeNull();
    expect(analysis.canUpgrade).toBe(false);
    expect(analysis.averageManaValue).toBe(1);
  });

  it("checks Core without combos and names the Game Changers", () => {
    const changer = spell("Smothering Tithe", 4, ["ramp"], { gameChanger: true });
    const analysis = analyzePrecon(build([changer, spell("Shock", 1, ["removal"])]));
    expect(analysis.gameChangers).toEqual(["Smothering Tithe"]);
    expect(analysis.bracket).toMatchObject({ bracket: 2, name: "Core", fits: false, combosChecked: false });
    expect(analysis.bracket.issues).toEqual(["1 Game Changers (bracket 2 allows 0)"]);

    const clean = analyzePrecon(build([spell("Shock", 1, ["removal"])]));
    expect(clean.bracket.fits).toBe(true);
    expect(clean.bracket.issues).toEqual([]);
  });

  it("counts a Game Changer commander", () => {
    const deck = build([spell("Shock", 1, ["removal"])]);
    const analysis = analyzePrecon({ ...deck, commander: { ...deck.commander, gameChanger: true } });
    expect(analysis.gameChangers).toEqual(["Krenko, Mob Boss"]);
    expect(analysis.bracket.fits).toBe(false);
  });

  it("groups the decklist by type in CARD_TYPES order, cheapest first", () => {
    const elf = card({ name: "Llanowar Elves", cmc: 1, manaCost: "{G}", typeLine: "Creature — Elf Druid" });
    const golem = card({ name: "Steel Golem", cmc: 3, typeLine: "Artifact Creature — Golem" });
    const bolt = card({ name: "Lightning Bolt", cmc: 1, manaCost: "{R}", typeLine: "Instant" });
    const ring = card({ name: "Sol Ring", cmc: 1, manaCost: "{1}", typeLine: "Artifact" });
    const analysis = analyzePrecon(build([ring, golem, land("Mountain Pass"), bolt, elf, basic("Mountain", "R")], { Mountain: 30 }));
    expect(analysis.groups.map((g) => [g.type, g.count])).toEqual([
      ["Creature", 2],
      ["Instant", 1],
      ["Artifact", 1],
      ["Land", 31],
    ]);
    expect(analysis.groups[0].cards.map((c) => c.name)).toEqual(["Llanowar Elves", "Steel Golem"]);
    expect(analysis.groups[3].cards.find((c) => c.name === "Mountain")).toMatchObject({ count: 30, manaCost: "", gameChanger: false });
  });

  it("describes the commanders and stays serializable", () => {
    const analysis = analyzePrecon(fullDeck());
    expect(analysis.commanders).toEqual([
      {
        name: "Krenko, Mob Boss",
        manaCost: "{2}{R}{R}",
        typeLine: "Legendary Creature — Goblin Warrior",
        colorIdentity: ["R"],
        image: null,
        gameChanger: false,
      },
    ]);
    expect(analysis.colorIdentity).toEqual(["R"]);
    expect(analysis.canUpgrade).toBe(true);
    expect(JSON.parse(JSON.stringify(analysis))).toEqual(analysis);
  });

  it("keeps the names that did not resolve", () => {
    const list: PreconList = {
      id: "Test_TST",
      name: "Test Deck",
      set: "TST",
      releaseDate: "2025-01-01",
      commanders: [commander.name],
      cards: [["Unknown Card", 1]],
    };
    const deck = preconDeck(list, { [commander.name]: commander })!;
    expect(analyzePrecon(deck).missing).toEqual(["Unknown Card"]);
  });
});
