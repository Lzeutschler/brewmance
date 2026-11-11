import { describe, expect, it } from "vitest";

import type { Color } from "@/lib/cards/types";
import type { PreconSummary } from "@/lib/precons/types";
import { commander } from "@/tests/fixtures";

import { answersOf, nextCardIn, swipeFor } from "./deck";
import {
  matchPercent,
  preconQuestions,
  preconWorlds,
  rankPrecons,
  recentSince,
  topPreconMatches,
} from "./precon-quiz";
import { QUESTIONS } from "./questions";
import type { QuizSwipe } from "./types";

function precon(name: string, set: string, releaseDate: string, colorIdentity: Color[], commanders = [`${name} Leader`]): PreconSummary {
  return { id: `${name.replace(/\W/g, "")}_${set}`, name, set, releaseDate, commanders, colorIdentity, image: null };
}

const PRECONS: PreconSummary[] = [
  precon("Rot and Roots", "SOC", "2026-04-24", ["B", "G"]),
  precon("Grave Tidings", "FDC", "2026-04-24", ["B"]),
  precon("Sky Patrol", "FDC", "2026-04-24", ["W", "U"]),
  precon("Limit Break", "FIC", "2025-06-13", ["W", "R", "G"]),
  precon("Old Growth", "C16", "2016-11-11", ["B", "G"]),
  precon("Iron Legion", "40K", "2022-10-07", ["W", "U", "B"]),
];

const COMMANDERS = [
  commander({ name: "Rot and Roots Leader", colorIdentity: ["B", "G"], cmc: 6, archetypes: { stompy: 0.9 } }),
  commander({ name: "Grave Tidings Leader", colorIdentity: ["B"], cmc: 3, archetypes: { aristocrats: 0.9 } }),
  commander({ name: "Sky Patrol Leader", colorIdentity: ["W", "U"], cmc: 2, archetypes: { tokens: 0.9 } }),
  commander({ name: "Limit Break Leader", colorIdentity: ["W", "R", "G"], cmc: 4, archetypes: { voltron: 0.8 } }),
  // Less popular than the newer deck's commander, so the newer deck wins on more than the tie-break.
  commander({ name: "Old Growth Leader", colorIdentity: ["B", "G"], cmc: 6, archetypes: { stompy: 0.9 }, edhrecRank: 9000 }),
  commander({ name: "Iron Legion Leader", colorIdentity: ["W", "U", "B"], cmc: 5, archetypes: { tokens: 0.6 } }),
];

const names = (matches: { precon: PreconSummary }[]) => matches.map((m) => m.precon.name);

describe("precon quiz questions", () => {
  const questions = preconQuestions(PRECONS);

  it("asks seven questions with unique ids, every answer with art, a symbol or as a gate's no", () => {
    expect(questions.map((q) => q.id)).toEqual(["colors", "side", "world", "size", "pace", "reading", "recency"]);
    for (const q of questions) {
      expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
      for (const o of q.options) expect(Boolean(o.art || o.symbol || o.exclusive)).toBe(true);
    }
  });

  it("offers only worlds that have a precon, Magic's own first", () => {
    expect(preconWorlds(PRECONS)).toEqual(["magic", "final-fantasy", "warhammer"]);
    expect(questions.find((q) => q.id === "world")!.options.map((o) => o.label)).toEqual([
      "Classic Magic worlds",
      "Final Fantasy",
      "Warhammer 40,000",
    ]);
  });

  it("copies the commander quiz's answers instead of sharing them", () => {
    const side = questions.find((q) => q.id === "side")!;
    const original = QUESTIONS.beginner.find((q) => q.id === "side")!;
    expect(side.options.map((o) => o.id)).toEqual(original.options.map((o) => o.id));
    expect(side.options[0]).not.toBe(original.options[0]);
    expect(side.options[0].effect).not.toBe(original.options[0].effect);
    const colors = questions.find((q) => q.id === "colors")!;
    expect(colors.options.filter((o) => !o.exclusive).map((o) => o.symbol)).toEqual(["W", "U", "B", "R", "G"]);
    expect(colors.options.find((o) => o.exclusive)?.label).toBe("No idea yet");
  });

  it("plays as 7 or 8 swipe cards", () => {
    const count = (gate: "yes" | "no") => {
      const swipes: QuizSwipe[] = [];
      for (let card = nextCardIn(questions, swipes); card; card = nextCardIn(questions, swipes)) {
        const choice = card.kind === "gate" ? gate : card.kind === "versus" ? "left" : card.kind === "pick" ? "done" : "yes";
        swipes.push(swipeFor(card, choice, { [card.question.id]: [card.question.options[0].id] }));
      }
      return swipes;
    };
    expect(count("yes")).toHaveLength(8);
    const skipped = count("no");
    expect(skipped).toHaveLength(7);
    expect(answersOf(skipped).colors).toEqual(["none"]);
  });
});

describe("recentSince", () => {
  it("counts back 24 months from the newest precon, not from today", () => {
    expect(recentSince(PRECONS)).toBe("2024-04-24");
    expect(recentSince([{ releaseDate: "2026-01-31" }])).toBe("2024-01-31");
    expect(recentSince([])).toBeNull();
  });
});

describe("rankPrecons", () => {
  it("puts the deck in exactly the picked colors first and says so", () => {
    const ranked = rankPrecons(PRECONS, COMMANDERS, { colors: ["B", "G"], size: ["big"] });
    expect(ranked[0].precon.name).toBe("Rot and Roots");
    expect(ranked[0].reasons).toEqual(["Black and green, like you picked", "Plays a big-creature game"]);
    expect(ranked[0].percent).toBe(99);
    expect(names(ranked).indexOf("Sky Patrol")).toBe(ranked.length - 1);
  });

  it("explains a deck with fewer or more colors than picked", () => {
    const ranked = rankPrecons(PRECONS, COMMANDERS, { colors: ["B", "G"] });
    expect(ranked.find((m) => m.precon.name === "Grave Tidings")!.reasons[0]).toBe("Black, one of your colors");
    const single = rankPrecons(PRECONS, COMMANDERS, { colors: ["B"] });
    expect(single[0].precon.name).toBe("Grave Tidings");
    expect(single.find((m) => m.precon.name === "Rot and Roots")!.reasons[0]).toBe("Black, plus green");
  });

  it("never puts a deck with an unpicked color above one that stays inside the picks", () => {
    const decks = [
      precon("Green Fit", "SOC", "2026-04-24", ["W", "G"]),
      precon("Only White", "FDC", "2026-04-24", ["W"]),
      precon("White Blue", "FDC", "2026-04-24", ["W", "U"]),
    ];
    const leaders = [
      commander({ name: "Green Fit Leader", colorIdentity: ["W", "G"], cmc: 6, archetypes: { stompy: 1 }, edhrecRank: 1 }),
      commander({ name: "Only White Leader", colorIdentity: ["W"], cmc: 3, archetypes: { tokens: 0.5 }, edhrecRank: 9000 }),
      commander({ name: "White Blue Leader", colorIdentity: ["W", "U"], cmc: 3, archetypes: { tokens: 0.5 }, edhrecRank: 9000 }),
    ];
    expect(names(rankPrecons(decks, leaders, { colors: ["W", "U"], size: ["big"] }))).toEqual(["White Blue", "Only White", "Green Fit"]);
  });

  it("ignores colors when the player has no idea yet", () => {
    const none = rankPrecons(PRECONS, COMMANDERS, { colors: ["none"] });
    const skipped = rankPrecons(PRECONS, COMMANDERS, {});
    expect(names(none)).toEqual(names(skipped));
  });

  it("ranks decks from a picked crossover world first", () => {
    const ranked = rankPrecons(PRECONS, COMMANDERS, { world: ["final-fantasy"], colors: ["B", "G"] });
    expect(ranked[0].precon.name).toBe("Limit Break");
    expect(ranked[0].reasons[0]).toBe("From Final Fantasy");
  });

  it("pushes older decks down when only decks in shops are wanted", () => {
    const any = rankPrecons(PRECONS, COMMANDERS, { colors: ["B", "G"], recency: ["any"] });
    const recent = rankPrecons(PRECONS, COMMANDERS, { colors: ["B", "G"], recency: ["recent"] });
    expect(names(any).indexOf("Old Growth")).toBeLessThan(names(recent).indexOf("Old Growth"));
    expect(names(recent).slice(0, 2)).toEqual(["Rot and Roots", "Grave Tidings"]);
  });

  it("breaks ties by the newer release and is deterministic", () => {
    const twins = [precon("Twin A", "C16", "2016-11-11", ["G"], []), precon("Twin B", "SOC", "2026-04-24", ["G"], [])];
    expect(names(rankPrecons(twins, [], {}))).toEqual(["Twin B", "Twin A"]);
    const answers = { colors: ["U"], side: ["trickster"], pace: ["fast"], reading: ["simple"] };
    expect(rankPrecons(PRECONS, COMMANDERS, answers)).toEqual(rankPrecons([...PRECONS].reverse(), COMMANDERS, answers));
  });

  it("scores a deck whose commander is unknown on its colors alone", () => {
    const ranked = rankPrecons([precon("Mystery", "SOC", "2026-04-24", ["B", "G"], ["Nobody"])], COMMANDERS, { colors: ["B", "G"] });
    expect(ranked[0].reasons).toEqual(["Black and green, like you picked"]);
  });

  it("falls back to the release year when no answer explains a deck", () => {
    expect(rankPrecons(PRECONS, COMMANDERS, {})[0].reasons).toHaveLength(1);
    expect(rankPrecons(PRECONS, COMMANDERS, {})[0].reasons[0]).toMatch(/^Released in \d{4}$/);
  });
});

describe("topPreconMatches", () => {
  const match = (name: string, score: number) => ({ precon: precon(name, "SOC", "2026-04-24", []), score, percent: 0, reasons: [] });

  it("shows three, and a 4th and 5th only when they are close to the 3rd", () => {
    expect(names(topPreconMatches([match("a", 50), match("b", 40), match("c", 30), match("d", 20), match("e", 10)]))).toEqual(["a", "b", "c"]);
    expect(names(topPreconMatches([match("a", 50), match("b", 40), match("c", 30), match("d", 28), match("e", 26)]))).toEqual(["a", "b", "c", "d"]);
    expect(names(topPreconMatches([match("a", 50), match("b", 40)]))).toEqual(["a", "b"]);
  });
});

describe("matchPercent", () => {
  it("maps the best score to 99 and the lowest to 1", () => {
    expect(matchPercent(80, 80, -20)).toBe(99);
    expect(matchPercent(-20, 80, -20)).toBe(1);
    expect(matchPercent(30, 80, -20)).toBe(50);
    expect(matchPercent(5, 5, 5)).toBe(99);
  });
});
