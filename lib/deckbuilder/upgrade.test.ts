import { describe, expect, it } from "vitest";

import { isLand } from "@/lib/cards/mana";
import type { Card } from "@/lib/cards/types";
import { deckCount, deckStats } from "@/lib/decks/stats";
import type { Deck } from "@/lib/decks/types";
import { basic, card, emptyDeck, land, spell } from "@/tests/fixtures";

import type { Combo } from "./combos";
import { DEFAULT_PREFERENCES, deckTemplate } from "./settings";
import type { Candidate } from "./types";
import {
  canUpgrade,
  decideSwap,
  explainCut,
  fitOf,
  nextSwap,
  rankSwaps,
  spentUsd,
  startUpgrade,
  swapsMade,
  undoSwap,
  type UpgradePool,
  type UpgradeSession,
} from "./upgrade";

const commander = card({ name: "Krenko, Mob Boss", typeLine: "Legendary Creature — Goblin Warrior", colorIdentity: ["R"], cmc: 4 });
const mountain = basic("Mountain", "R");

/** 62 spells that fill every role and the curve reasonably, 12 nonbasic lands and 25 Mountains. */
function fullDeck(bracket: Deck["bracket"] = 2): { deck: Deck; spells: Candidate[]; lands: Candidate[] } {
  const spells: Candidate[] = [];
  const add = (name: string, cmc: number, roles: Parameters<typeof spell>[2] = []) => spells.push(spell(name, cmc, roles, { synergy: 0.3, inclusion: 0.5 }));
  for (let i = 0; i < 10; i++) add(`Ramp ${i}`, 2, ["ramp"]);
  for (let i = 0; i < 10; i++) add(`Draw ${i}`, 3, ["draw"]);
  for (let i = 0; i < 8; i++) add(`Removal ${i}`, 2, ["removal"]);
  for (let i = 0; i < 3; i++) add(`Wipe ${i}`, 5, ["boardwipe"]);
  for (let i = 0; i < 2; i++) add(`Protection ${i}`, 1, ["protection"]);
  for (let i = 0; i < 3; i++) add(`Finisher ${i}`, 6, ["wincon"]);
  for (let i = 0; i < 26; i++) add(`Goblin ${i}`, (i % 5) + 1);
  const lands = Array.from({ length: 12 }, (_, i) => land(`Land ${i}`, ["R"], { synergy: 0.1, inclusion: 0.4 }));
  const deck: Deck = {
    ...emptyDeck(commander, bracket),
    entries: [...[...spells, ...lands].map((c) => ({ card: c as Card, quantity: 1 })), { card: mountain, quantity: 25 }],
  };
  return { deck, spells, lands };
}

function makePool(candidates: Candidate[], extra: Partial<UpgradePool> = {}): UpgradePool {
  return { candidates, combos: null, source: "edhrec", deckCount: 1000, averageLands: 37, ...extra };
}

function begin(deck: Deck, pool: UpgradePool, budgetUsd: number | null = null) {
  return startUpgrade(deck, pool, budgetUsd);
}

describe("rankSwaps", () => {
  it("trades the weakest card for the best one on offer", () => {
    const { deck, spells } = fullDeck();
    const weak = spells.find((c) => c.name === "Goblin 7")!;
    weak.synergy = 0;
    weak.inclusion = 0.02;
    const star = spell("Goblin Chieftain", weak.cmc, [], { synergy: 0.9, inclusion: 0.8 });
    const pool = makePool([...spells, star, spell("Meh", 3, [], { synergy: 0.1, inclusion: 0.1 })]);
    const state = begin(deck, pool);

    const swap = nextSwap(state.deck, pool, state.session)!;
    expect(swap.out.name).toBe("Goblin 7");
    expect(swap.in.name).toBe("Goblin Chieftain");
    expect(swap.gain).toBeGreaterThan(0.3);
  });

  it("rates deck cards the pool does not list as hardly played", () => {
    const { deck, spells } = fullDeck();
    const pool = makePool(spells.filter((c) => c.name !== "Goblin 3"));
    const stranger = deck.entries.find((e) => e.card.name === "Goblin 3")!.card;
    expect(fitOf(stranger, pool)).toMatchObject({ synergy: 0, inclusion: 0 });
    expect(fitOf(stranger, makePool([], { source: "fallback" })).inclusion).toBeGreaterThan(0);

    const withUpgrade = makePool([...pool.candidates, spell("Better", 3, [], { synergy: 0.6, inclusion: 0.6 })]);
    const state = begin(deck, withUpgrade);
    expect(nextSwap(state.deck, withUpgrade, state.session)!.out.name).toBe("Goblin 3");
  });

  it("offers nothing when no card on offer is clearly better", () => {
    const { deck, spells, lands } = fullDeck();
    const pool = makePool([...spells, ...lands, spell("Same", 3, [], { synergy: 0.3, inclusion: 0.5 })]);
    const state = begin(deck, pool);
    expect(rankSwaps(state.deck, pool, state.session)).toEqual([]);
  });

  it("fills a role the deck is short on and cuts a card without a role", () => {
    const { deck, spells } = fullDeck();
    // Take out four draw spells and put vanilla goblins in their place.
    const dropped = new Set(["Draw 0", "Draw 1", "Draw 2", "Draw 3"]);
    const fillers = Array.from({ length: 4 }, (_, i) => spell(`Filler ${i}`, 3, [], { synergy: 0.3, inclusion: 0.5 }));
    const short: Deck = {
      ...deck,
      entries: [...deck.entries.filter((e) => !dropped.has(e.card.name)), ...fillers.map((c) => ({ card: c, quantity: 1 }))],
    };
    // The pool still lists the dropped draw spells, next to a goblin that fits better on paper.
    const pool = makePool([...spells, ...fillers, spell("Shiny Goblin", 3, [], { synergy: 0.5, inclusion: 0.6 })]);
    const state = begin(short, pool);
    const swap = nextSwap(state.deck, pool, state.session)!;
    expect(swap.in.roles).toEqual(["draw"]);
    expect(swap.out.roles).toEqual([]);
  });

  it("keeps the land count: spells trade for spells and lands for lands", () => {
    const { deck, spells, lands } = fullDeck();
    lands[0].inclusion = 0;
    lands[0].synergy = 0;
    spells[40].inclusion = 0;
    spells[40].synergy = 0;
    const pool = makePool([
      ...spells,
      ...lands,
      land("Great Land", ["R"], { synergy: 0.5, inclusion: 0.9 }),
      spell("Great Spell", spells[40].cmc, [], { synergy: 0.9, inclusion: 0.9 }),
    ]);
    let state = begin(deck, pool);
    const before = deckStats(state.deck);
    for (let i = 0; i < 4; i++) {
      const swap = nextSwap(state.deck, pool, state.session);
      if (!swap) break;
      expect(isLand(swap.in)).toBe(isLand(swap.out));
      state = decideSwap(state.session, state.deck, swap, "swap");
    }
    expect(swapsMade(state.session)).toHaveLength(2);
    expect(deckStats(state.deck).lands).toBe(before.lands);
    expect(deckCount(state.deck.entries)).toBe(99);
  });

  it("trades a basic land only while the deck is short of nonbasic lands", () => {
    const { deck, spells, lands } = fullDeck();
    const tower = land("Command Tower", ["R"], { synergy: 0.3, inclusion: 0.9 });
    const pool = makePool([...spells, ...lands, tower]);

    // A mono-colored deck wants four nonbasic lands and has twelve: basics stay.
    const full = begin(deck, pool);
    expect(rankSwaps(full.deck, pool, full.session).every((s) => s.out.name !== "Mountain")).toBe(true);

    const fewNonbasics: Deck = {
      ...deck,
      entries: [...deck.entries.filter((e) => !lands.slice(2).some((l) => l.id === e.card.id) && e.card.id !== mountain.id), { card: mountain, quantity: 35 }],
    };
    const state = begin(fewNonbasics, pool);
    expect(deckTemplate(state.deck).nonbasicLands).toBeGreaterThan(2);
    const swap = rankSwaps(state.deck, pool, state.session).find((s) => s.out.name === "Mountain")!;
    expect(swap.in.name).toBe("Command Tower");
    const next = decideSwap(state.session, state.deck, swap, "swap");
    expect(next.deck.entries.find((e) => e.card.id === mountain.id)!.quantity).toBe(34);
  });

  it("respects the bracket, the price limit per card and the total budget", () => {
    const { deck, spells } = fullDeck(2);
    spells[30].inclusion = 0;
    spells[30].synergy = 0;
    const cmc = spells[30].cmc;
    const pool = makePool([
      ...spells,
      spell("Game Changer", cmc, [], { synergy: 1, inclusion: 1, gameChanger: true }),
      spell("Pricey", cmc, [], { synergy: 0.9, inclusion: 0.9, priceUsd: 40 }),
      spell("Mid", cmc, [], { synergy: 0.8, inclusion: 0.8, priceUsd: 8 }),
      spell("Cheap", cmc, [], { synergy: 0.7, inclusion: 0.7, priceUsd: 2 }),
    ]);

    const unlimited = begin(deck, pool);
    expect(nextSwap(unlimited.deck, pool, unlimited.session)!.in.name).toBe("Pricey");

    const perCard: Deck = { ...deck, settings: { overrides: {}, preferences: { ...DEFAULT_PREFERENCES, maxPriceUsd: 10 } } };
    const capped = begin(perCard, pool);
    expect(nextSwap(capped.deck, pool, capped.session)!.in.name).toBe("Mid");

    // A budget of 20 rules out Pricey, and no card may take more than 40% of it: Mid at 8 just fits.
    let state = begin(deck, pool, 20);
    const first = nextSwap(state.deck, pool, state.session)!;
    expect(first.in.name).toBe("Mid");
    state = decideSwap(state.session, state.deck, first, "swap");
    expect(spentUsd(state.session)).toBe(8);
    // With a budget of 9, Mid would take nearly all of it.
    const tight = begin(deck, pool, 9);
    expect(nextSwap(tight.deck, pool, tight.session)!.in.name).toBe("Cheap");
    // One dollar left: nothing with a higher price is offered any more.
    const nearlySpent = { ...state.session, budgetUsd: 9 };
    expect(rankSwaps(state.deck, pool, nearlySpent).every((s) => (s.in.priceUsd ?? 0) <= 1)).toBe(true);
  });

  it("does not complete a two-card combo below bracket 4", () => {
    const { deck, spells } = fullDeck(2);
    spells[30].inclusion = 0;
    spells[30].synergy = 0;
    const piece = spell("Combo Piece", spells[30].cmc, [], { synergy: 1, inclusion: 1 });
    const combos: Combo[] = [{ id: "1", cards: ["Combo Piece", "Goblin 1"], results: ["Infinite goblins"], bracketTag: "R", manaValue: 5 }];
    const pool = makePool([...spells, piece, spell("Honest Card", spells[30].cmc, [], { synergy: 0.7, inclusion: 0.7 })], { combos });
    const state = begin(deck, pool);
    expect(nextSwap(state.deck, pool, state.session)!.in.name).toBe("Honest Card");
  });
});

describe("decisions", () => {
  function scenario() {
    const { deck, spells } = fullDeck();
    spells[30].inclusion = 0;
    spells[30].synergy = 0;
    spells[31].inclusion = 0.01;
    spells[31].synergy = 0;
    const pool = makePool([
      ...spells,
      spell("First Choice", spells[30].cmc, [], { synergy: 0.9, inclusion: 0.9 }),
      spell("Second Choice", spells[30].cmc, [], { synergy: 0.8, inclusion: 0.8 }),
    ]);
    return { pool, weak: spells[30], ...begin(deck, pool) };
  }

  it("pass turns the new card down and offers another for the same cut", () => {
    const { pool, weak, deck, session } = scenario();
    const first = nextSwap(deck, pool, session)!;
    expect([first.out.name, first.in.name]).toEqual([weak.name, "First Choice"]);
    const passed = decideSwap(session, deck, first, "pass");
    expect(passed.deck.entries).toBe(deck.entries);
    const second = nextSwap(passed.deck, pool, passed.session)!;
    expect([second.out.name, second.in.name]).toEqual([weak.name, "Second Choice"]);
  });

  it("maybe also puts the new card on the maybe list", () => {
    const { pool, deck, session } = scenario();
    const first = nextSwap(deck, pool, session)!;
    const next = decideSwap(session, deck, first, "maybe");
    expect(next.deck.maybe.map((c) => c.name)).toEqual(["First Choice"]);
    expect(nextSwap(next.deck, pool, next.session)!.in.name).toBe("Second Choice");
    expect(undoSwap(next.session, next.deck).deck.maybe).toEqual([]);
  });

  it("keep protects the deck's card and offers the new card for another cut", () => {
    const { pool, weak, deck, session } = scenario();
    const first = nextSwap(deck, pool, session)!;
    const kept = decideSwap(session, deck, first, "keep");
    const second = nextSwap(kept.deck, pool, kept.session)!;
    expect(second.out.name).not.toBe(weak.name);
    expect(second.in.name).toBe("First Choice");
  });

  it("swap trades the cards, never offers either again, and undo restores the deck", () => {
    const { pool, weak, deck, session } = scenario();
    const first = nextSwap(deck, pool, session)!;
    const swapped = decideSwap(session, deck, first, "swap");
    const names = swapped.deck.entries.map((e) => e.card.name);
    expect(names).toContain("First Choice");
    expect(names).not.toContain(weak.name);
    expect(swapped.deck.entries.find((e) => e.card.name === "First Choice")!.card).not.toHaveProperty("synergy");
    expect(deckCount(swapped.deck.entries)).toBe(99);

    for (const swap of rankSwaps(swapped.deck, pool, swapped.session)) {
      expect(swap.out.name).not.toBe("First Choice");
      expect(swap.in.name).not.toBe(weak.name);
    }

    const undone = undoSwap(swapped.session, swapped.deck);
    expect(undone.session.history).toEqual([]);
    expect(undone.deck.entries.map((e) => e.card.name).sort()).toEqual(deck.entries.map((e) => e.card.name).sort());
  });

  it("undo leaves a deck alone whose swapped-in card was removed since", () => {
    const { pool, deck, session } = scenario();
    const swapped = decideSwap(session, deck, nextSwap(deck, pool, session)!, "swap");
    const edited: Deck = { ...swapped.deck, entries: swapped.deck.entries.filter((e) => e.card.name !== "First Choice") };
    const undone = undoSwap(swapped.session, edited);
    expect(undone.deck.entries).toBe(edited.entries);
    expect(undone.session.history).toEqual([]);
  });
});

describe("explainCut", () => {
  it("names low play rates, crowded roles and a crowded curve", () => {
    const { deck, spells } = fullDeck();
    const extraWipes = Array.from({ length: 3 }, (_, i) => spell(`Extra Wipe ${i}`, 5, ["boardwipe"], { synergy: 0, inclusion: 0.03 }));
    const crowded: Deck = {
      ...deck,
      entries: [...deck.entries.filter((e) => !/^Goblin [012]$/.test(e.card.name)), ...extraWipes.map((c) => ({ card: c, quantity: 1 }))],
    };
    const pool = makePool([...spells, ...extraWipes, spell("Better", 2, [], { synergy: 0.8, inclusion: 0.8 })]);
    const state = begin(crowded, pool);
    const swap = nextSwap(state.deck, pool, state.session)!;
    expect(swap.out.name).toMatch(/^Extra Wipe/);
    const reasons = explainCut(swap, state.deck, pool, "Krenko");
    expect(reasons[0]).toBe("Only in 3% of Krenko decks");
    expect(reasons.some((r) => r.startsWith("More board wipes than the deck needs (6/"))).toBe(true);
  });
});

describe("canUpgrade", () => {
  it("needs a nearly complete deck", () => {
    const { deck } = fullDeck();
    expect(canUpgrade(deck)).toBe(true);
    expect(canUpgrade({ ...deck, entries: deck.entries.slice(0, 40) })).toBe(false);
  });
});

/** Swapping everything on offer ends, and the deck stays at 99 cards. */
it("an upgrade run comes to an end", () => {
  const { deck, spells, lands } = fullDeck();
  const offers = Array.from({ length: 40 }, (_, i) => spell(`Offer ${i}`, (i % 6) + 1, i % 4 === 0 ? ["draw"] : [], { synergy: 0.2 + (i % 8) / 10, inclusion: 0.3 + (i % 7) / 10 }));
  const pool = makePool([...spells, ...lands, ...offers]);
  let state: { deck: Deck; session: UpgradeSession } = begin(deck, pool);
  let guard = 0;
  for (let swap = nextSwap(state.deck, pool, state.session); swap && guard < 200; swap = nextSwap(state.deck, pool, state.session), guard++) {
    state = decideSwap(state.session, state.deck, swap, guard % 3 === 2 ? "pass" : "swap");
  }
  expect(guard).toBeLessThan(200);
  expect(deckCount(state.deck.entries)).toBe(99);
  expect(swapsMade(state.session).length).toBeGreaterThan(0);
});
