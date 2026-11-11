import { describe, expect, it } from "vitest";

import type { CommanderSummary } from "@/lib/cards/types";
import { combineArchetypes, confirmedTribes, edhrecAffinity } from "@/lib/tagging/archetypes";
import { commander } from "@/tests/fixtures";

import { franchiseOf } from "./franchises";
import { QUESTIONS, TRACK_QUESTION } from "./questions";
import {
  buildProfile,
  createScoringContext,
  emptyProfile,
  rankCommanders,
  rulesComplexity,
  scoreCommander,
} from "./scoring";
import type { PopularityMode, QuizProfile } from "./types";

const names = (ranked: { commander: CommanderSummary }[]) => ranked.map((r) => r.commander.name);

function rank(commanders: CommanderSummary[], profile: Partial<QuizProfile>, popularity: PopularityMode = "balanced") {
  return names(rankCommanders(commanders, { ...emptyProfile("advanced"), ...profile }, popularity));
}

describe("questions", () => {
  it("has a 7-question track for beginners and for advanced players", () => {
    expect(TRACK_QUESTION.options.map((o) => o.id)).toEqual(["beginner", "advanced"]);
    expect(QUESTIONS.advanced).toHaveLength(7);
    expect(QUESTIONS.beginner).toHaveLength(7);
  });

  it("uses unique ids and gives every answer art or a symbol", () => {
    for (const questions of Object.values(QUESTIONS)) {
      expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
      for (const q of questions) {
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        for (const o of q.options) expect(Boolean(o.art || o.symbol || o.exclusive)).toBe(true);
      }
    }
  });
});

describe("buildProfile", () => {
  it("adds up the effects of picked answers, including follow-ups", () => {
    const profile = buildProfile("advanced", QUESTIONS.advanced, {
      win: ["drain", "army"],
      engine: ["graveyard"],
      tempo: ["fast"],
      colors: ["W", "B"],
      colorCount: ["two"],
      tribe: ["none"],
    });
    expect(profile.archetypes.aristocrats).toBe(3.5);
    expect(profile.archetypes.tokens).toBe(3);
    expect(profile.archetypes.reanimator).toBe(3);
    expect(profile.colors).toEqual(["W", "B"]);
    expect(profile.colorCount).toBe("two");
    expect(profile.tempo).toBe("fast");
    expect(profile.noTribe).toBe(true);
  });

  it("treats a skipped color question as no color preference, and colorless as a choice", () => {
    expect(buildProfile("advanced", QUESTIONS.advanced, { colors: [] }).colors).toBeNull();
    const colorless = buildProfile("advanced", QUESTIONS.advanced, { colors: ["C"] });
    expect(colorless.colors).toEqual([]);
    expect(colorless.colorless).toBe(true);
  });

  it("collects beginner vibes", () => {
    const profile = buildProfile("beginner", QUESTIONS.beginner, {
      side: ["hero"],
      world: ["lotr", "marvel"],
      critters: ["rabbit"],
      mood: ["cozy"],
    });
    expect(profile.franchises).toEqual(["lotr", "marvel"]);
    expect(profile.tribes).toEqual(["Rabbit", "Mouse"]);
    expect(profile.colorLean.W).toBeGreaterThan(2);
    expect(profile.sets).toContain("blb");
    expect(profile.creatureLean).toContain("Angel");
  });
});

describe("scoring", () => {
  const teysa = commander({ name: "Teysa Karlov", colorIdentity: ["W", "B"], archetypes: { aristocrats: 1, tokens: 0.6 } });
  const krenko = commander({ name: "Krenko, Mob Boss", colorIdentity: ["R"], archetypes: { tokens: 1, typal: 0.9 }, tribes: ["Goblin"] });
  const vanilla = commander({ name: "Vanilla Legend", colorIdentity: ["G"] });

  it("ranks commanders by how well their archetypes fit", () => {
    expect(rank([vanilla, krenko, teysa], { archetypes: { aristocrats: 3 } })[0]).toBe("Teysa Karlov");
    expect(rank([vanilla, teysa, krenko], { archetypes: { tokens: 3 } })[0]).toBe("Krenko, Mob Boss");
  });

  it("penalizes colors outside the chosen ones", () => {
    const ranked = rank([teysa, krenko, vanilla], { colors: ["R", "G"] });
    expect(ranked.at(-1)).toBe("Teysa Karlov");
    const colorless = commander({ name: "Karn", colorIdentity: [] });
    expect(rank([vanilla, colorless], { colors: [], colorless: true })[0]).toBe("Karn");
  });

  it("prefers the chosen number of colors", () => {
    expect(rank([krenko, teysa], { colorCount: "two" })[0]).toBe("Teysa Karlov");
    expect(rank([teysa, krenko], { colorCount: "mono" })[0]).toBe("Krenko, Mob Boss");
  });

  it("rewards commanders that lead a favorite creature type over ones that merely are one", () => {
    const goblinLegend = commander({ name: "Goblin Legend", creatureTypes: ["Goblin"] });
    expect(rank([vanilla, goblinLegend, krenko], { tribes: ["Goblin"] })).toEqual(["Krenko, Mob Boss", "Goblin Legend", "Vanilla Legend"]);
    expect(rank([krenko, vanilla], { noTribe: true })[0]).toBe("Vanilla Legend");
  });

  it("says a commander leads a type only when it is one", () => {
    const profile = { ...emptyProfile("advanced"), tribes: ["Dragon"] };
    const reason = (c: CommanderSummary) =>
      rankCommanders([c], profile, "balanced")[0].reasons.find((r) => r.kind === "tribe")?.text;
    expect(reason(commander({ name: "Dragon Lord", creatureTypes: ["Dragon"], tribes: ["Dragon"] }))).toBe("Leads Dragons");
    expect(reason(commander({ name: "Estinien Varlineau", creatureTypes: ["Elf", "Warrior"], tribes: ["Dragon"] }))).toBe("Rewards Dragons");
  });

  it("boosts the chosen franchises and lowers other worlds", () => {
    const frodo = commander({ name: "Frodo", set: "ltr" });
    const spidey = commander({ name: "Spider-Man", set: "spm" });
    expect(rank([vanilla, spidey, frodo], { franchises: ["lotr"] })[0]).toBe("Frodo");
    expect(rank([frodo, spidey, vanilla], { franchises: ["magic"] })[0]).toBe("Vanilla Legend");
    expect(franchiseOf("ltr")).toBe("lotr");
    expect(franchiseOf("spm")).toBe("marvel");
    expect(franchiseOf("dmu")).toBe("magic");
    expect(franchiseOf("trc")).toBe("star-trek");
  });

  it("matches tempo through mana value", () => {
    const cheap = commander({ name: "Cheap", cmc: 2 });
    const huge = commander({ name: "Huge", cmc: 7 });
    expect(rank([huge, cheap], { tempo: "fast" })[0]).toBe("Cheap");
    expect(rank([cheap, huge], { tempo: "slow" })[0]).toBe("Huge");
  });

  it("matches complexity through rules text", () => {
    const simpleText = { name: "Simple", oracleText: "Flying", pairings: [] };
    const complexText = {
      oracleText: "Whenever you cast a spell, copy it.\n{T}: Untap another permanent.\nAt the beginning of your end step, if you control three or more artifacts, draw a card for each.",
      name: "Complex",
      pairings: [],
    };
    expect(rulesComplexity(complexText)).toBeGreaterThan(rulesComplexity(simpleText));
    const simple = commander({ name: "Simple", complexity: rulesComplexity(simpleText) });
    const complex = commander({ name: "Complex", complexity: rulesComplexity(complexText) });
    expect(rank([complex, simple], { complexity: "simple" })[0]).toBe("Simple");
    expect(rank([simple, complex], { complexity: "complex" })[0]).toBe("Complex");
  });

  it("switches between popular picks and hidden gems", () => {
    const famous = commander({ name: "Famous", edhrecRank: 10 });
    const known = commander({ name: "Known", edhrecRank: 900 });
    const obscure = commander({ name: "Obscure", edhrecRank: 5000 });
    const pool = [obscure, known, famous];
    expect(rank(pool, {}, "popular")).toEqual(["Famous", "Known", "Obscure"]);
    expect(rank(pool, {}, "hidden")[0]).not.toBe("Famous");
  });

  it("explains a match with at most four reasons, strongest first", () => {
    const profile: QuizProfile = { ...emptyProfile("advanced"), archetypes: { aristocrats: 3 }, colors: ["W", "B"], tribes: [] };
    const scored = scoreCommander(teysa, profile, createScoringContext([teysa, krenko]), "balanced");
    expect(scored.reasons.length).toBeGreaterThan(0);
    expect(scored.reasons.length).toBeLessThanOrEqual(4);
    expect(scored.reasons.map((r) => r.kind)).toEqual(expect.arrayContaining(["archetype", "colors"]));
    const points = scored.reasons.map((r) => r.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
    expect(scored.reasons.every((r) => r.text.length > 0)).toBe(true);
  });

  it("breaks ties by popularity", () => {
    const a = commander({ name: "A", edhrecRank: 500 });
    const b = commander({ name: "B", edhrecRank: 50 });
    expect(rank([a, b], {})).toEqual(["B", "A"]);
  });
});

describe("archetype tagging", () => {
  it("weighs EDHREC themes against the commander's strongest theme", () => {
    expect(edhrecAffinity(100, 100)).toBe(1);
    expect(edhrecAffinity(50, 100)).toBeCloseTo(0.65);
    expect(edhrecAffinity(2, 100)).toBeLessThan(0.6);
  });

  it("lets the strongest source win and ignores text patterns for cards Tagger reviewed", () => {
    const merged = combineArchetypes({
      tagger: new Set(["aristocrats"]),
      text: new Set(["mill"]),
      typal: false,
      edhrecThemes: { aristocrats: 300, tokens: 150 },
    });
    expect(merged).toEqual({ aristocrats: 1, tokens: 0.65 });
    expect(combineArchetypes({ tagger: null, text: new Set(["mill"]), typal: true, edhrecThemes: {} })).toEqual({ mill: 0.4, typal: 0.9 });
  });

  it("only counts creature types Tagger confirms as typal", () => {
    expect(confirmedTribes(["Elf", "Warrior"], new Set(["typal-elf"]))).toEqual(["Elf"]);
    expect(confirmedTribes(["Human"], new Set(["typal-non-human"]))).toEqual([]);
    expect(confirmedTribes(["Goblin"], null)).toEqual(["Goblin"]);
  });
});
