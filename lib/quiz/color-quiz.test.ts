import { describe, expect, it } from "vitest";

import { COLORS, identityName, sortColors } from "@/lib/cards/colors";
import type { Color } from "@/lib/cards/types";
import { GLOSSARY_TERM_IDS } from "@/lib/learn";

import {
  COLOR_PIE,
  COLOR_QUESTIONS,
  colorLeanOf,
  colorList,
  colorQuizResult,
  combinationAnchor,
  combinationHref,
  combinationSentence,
  COUNT_QUESTION,
  preconsHref,
} from "./color-quiz";
import { answersOf, nextCardIn, swipeFor } from "./deck";
import type { Answers } from "./types";

/** Every way through the quiz: each question answered with one of its options, or left empty where that is possible. */
function allAnswers(): Answers[] {
  let paths: Answers[] = [{}];
  for (const question of COLOR_QUESTIONS) {
    const choices = question.options.map((o) => [o.id]);
    // A yes/no list can be swiped "no" all the way, a pick card skipped; a versus card always gives an answer.
    if (question.card.kind !== "versus") choices.push([]);
    paths = paths.flatMap((answers) => choices.map((ids) => (ids.length ? { ...answers, [question.id]: ids } : answers)));
  }
  return paths;
}

describe("color quiz questions", () => {
  it("has five to seven cards, and ends on the color count", () => {
    expect(COLOR_QUESTIONS.length).toBeGreaterThanOrEqual(5);
    expect(COLOR_QUESTIONS.length).toBeLessThanOrEqual(7);
    expect(COLOR_QUESTIONS.at(-1)?.id).toBe(COUNT_QUESTION);
    expect(new Set(COLOR_QUESTIONS.map((q) => q.id)).size).toBe(COLOR_QUESTIONS.length);
  });

  it("gives every answer art, and every answer but the count a color", () => {
    for (const question of COLOR_QUESTIONS) {
      for (const option of question.options) {
        expect(option.art, `${question.id}:${option.id}`).toBeTruthy();
        if (question.id !== COUNT_QUESTION) expect(Object.keys(option.effect.colorLean ?? {}).length, `${question.id}:${option.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("plays through the generic deck to the end", () => {
    let swipes = [] as ReturnType<typeof swipeFor>[];
    for (let i = 0; i < 20; i++) {
      const card = nextCardIn(COLOR_QUESTIONS, swipes);
      if (!card) break;
      const choice = card.kind === "versus" ? "right" : card.kind === "pick" ? "done" : "yes";
      const picked = card.kind === "pick" ? { [card.question.id]: [card.question.options[0].id] } : {};
      swipes = [...swipes, swipeFor(card, choice, picked)];
    }
    expect(nextCardIn(COLOR_QUESTIONS, swipes)).toBeNull();
    expect(answersOf(swipes)).toEqual({ side: ["hero"], mood: ["cozy"], decide: ["instinct"], matters: ["alone"], world: ["reshape"], count: ["mix"] });
  });
});

describe("colorQuizResult", () => {
  it("adds up the color leanings of the picked answers", () => {
    expect(colorLeanOf({ side: ["hero"], mood: ["radiant"], matters: ["together"] })).toEqual({ W: 6, U: 0, B: -1, R: 0, G: 1 });
    expect(colorLeanOf({})).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0 });
  });

  it("is deterministic", () => {
    for (const answers of allAnswers()) expect(colorQuizResult(answers)).toEqual(colorQuizResult(structuredClone(answers)));
  });

  it("returns one color for 'one', two or three for a mix, always in WUBRG order", () => {
    for (const answers of allAnswers()) {
      const result = colorQuizResult(answers);
      expect(result).toEqual(sortColors(result));
      expect(new Set(result).size).toBe(result.length);
      if (answers[COUNT_QUESTION]?.[0] === "one") expect(result).toHaveLength(1);
      else {
        expect(result.length).toBeGreaterThanOrEqual(2);
        expect(result.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("can reach every single color", () => {
    const reached = new Set(allAnswers().filter((a) => a[COUNT_QUESTION]?.[0] === "one").map((a) => colorQuizResult(a).join("")));
    expect([...reached].sort()).toEqual([...COLORS].sort());
  });

  it("gives each color for the answers that lean toward it", () => {
    const one = { [COUNT_QUESTION]: ["one"] };
    expect(colorQuizResult({ side: ["hero"], mood: ["radiant"], decide: ["plan"], matters: ["together"], world: ["grow"], ...one })).toEqual(["W"]);
    expect(colorQuizResult({ side: ["trickster"], mood: ["arcane"], decide: ["plan"], matters: ["together"], world: ["reshape"], ...one })).toEqual(["U"]);
    expect(colorQuizResult({ side: ["villain"], mood: ["spooky"], decide: ["plan"], matters: ["alone"], world: ["reshape"], ...one })).toEqual(["B"]);
    expect(colorQuizResult({ side: ["wild"], mood: ["fiery"], decide: ["instinct"], matters: ["alone"], world: ["reshape"], ...one })).toEqual(["R"]);
    expect(colorQuizResult({ side: ["wild"], mood: ["nature"], decide: ["instinct"], matters: ["together"], world: ["grow"], ...one })).toEqual(["G"]);
  });

  it("mixes the leading colors and adds a close third", () => {
    // B 5.5, R 5.5, U 1: a two-color mix.
    expect(colorQuizResult({ side: ["villain"], mood: ["fiery"], decide: ["instinct"], matters: ["alone"], world: ["reshape"], count: ["mix"] })).toEqual(["B", "R"]);
    // W 4, G 3, U 2: blue is too far behind green to join.
    expect(colorQuizResult({ side: ["hero"], mood: ["fiery"], decide: ["plan"], matters: ["together"], world: ["grow"], count: ["mix"] })).toEqual(["W", "G"]);
    // W 4, R 4, G 3: green is close enough to red to make a third color.
    expect(colorQuizResult({ side: ["hero"], mood: ["fiery"], decide: ["instinct"], matters: ["together"], world: ["grow"], count: ["mix"] })).toEqual(["W", "R", "G"]);
  });

  it("reaches many combinations, including three-color ones", () => {
    const reached = new Set(allAnswers().map((a) => colorQuizResult(a).join("")));
    expect([...reached].filter((key) => key.length === 2).length).toBeGreaterThanOrEqual(8);
    expect([...reached].some((key) => key.length === 3)).toBe(true);
  });

  it("assumes a mix when the last card is unanswered", () => {
    expect(colorQuizResult({}).length).toBeGreaterThanOrEqual(2);
  });
});

describe("result text and links", () => {
  it("names the colors in plain words", () => {
    expect(colorList(["G", "B"])).toBe("black and green");
    expect(colorList(["G", "W", "U"])).toBe("white, blue and green");
    expect(combinationSentence(["B", "G"])).toBe("Black and green together are called Golgari.");
    expect(combinationSentence(["B"])).toBe("Mono-Black means a deck with only black cards.");
  });

  it("links to the combination's anchor and the precons in its colors", () => {
    expect(combinationAnchor(["G", "B"])).toBe("golgari");
    expect(combinationHref(["B"])).toBe("/learn/color-combinations#mono-black");
    expect(preconsHref(["G", "W", "U"])).toBe("/precons?colors=wug");
    for (const answers of allAnswers()) {
      const colors = colorQuizResult(answers);
      expect(combinationAnchor(colors)).toMatch(/^[a-z]+(-[a-z]+)?$/);
      expect(combinationAnchor(colors)).toBe(identityName(colors).toLowerCase());
    }
  });

  it("describes every color, linking only to real glossary entries", () => {
    for (const color of COLORS as Color[]) {
      const entry = COLOR_PIE[color];
      expect(entry.short && entry.values).toBeTruthy();
      for (const part of entry.games) if (typeof part !== "string") expect(GLOSSARY_TERM_IDS).toContain(part.term);
    }
  });
});
