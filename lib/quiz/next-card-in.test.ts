import { describe, expect, it } from "vitest";

import { answersOf, nextCardIn, pickedOptionsIn, progressIn, swipeFor, type QuizCard } from "./deck";
import type { AnswerOption, Question, QuizChoice, QuizSwipe } from "./types";

const option = (id: string, extra: Partial<AnswerOption> = {}): AnswerOption => ({ id, label: id.toUpperCase(), effect: {}, ...extra });

/** A tiny quiz: a yes/no list, a versus with a middle, a gated pick list and a single pick. */
const QUIZ: Question[] = [
  { id: "taste", title: "Taste", max: 1, card: { kind: "yesno", limit: 3 }, options: ["sweet", "sour", "salty", "bitter"].map((id) => option(id)) },
  { id: "pace", title: "Pace", max: 1, card: { kind: "versus", left: "slow", right: "fast", middle: "mixed" }, options: [option("slow"), option("fast"), option("mixed")] },
  {
    id: "pets",
    title: "Pets",
    max: 2,
    card: { kind: "pick", gate: { title: "Pets?", description: "Do you like pets?", art: "a/b/gate" } },
    options: [option("cat"), option("dog"), option("none", { exclusive: true })],
  },
  { id: "drink", title: "Drink", max: 1, card: { kind: "pick" }, options: [option("tea"), option("coffee")] },
];

/** Swipes through the quiz, answering each card with `choose`. */
function play(choose: (card: QuizCard) => QuizChoice, picked: QuizSwipe["answers"] = {}): QuizSwipe[] {
  const swipes: QuizSwipe[] = [];
  for (let card = nextCardIn(QUIZ, swipes); card; card = nextCardIn(QUIZ, swipes)) {
    swipes.push(swipeFor(card, choose(card), { [card.question.id]: picked[card.question.id] ?? [] }));
  }
  return swipes;
}

describe("nextCardIn", () => {
  it("shows yes/no answers in written order without a fit, and stops at the most yeses", () => {
    expect(nextCardIn(QUIZ, [])?.id).toBe("taste:sweet");
    const swipes = [swipeFor(nextCardIn(QUIZ, [])!, "no")];
    expect(nextCardIn(QUIZ, swipes)?.id).toBe("taste:sour");
    swipes.push(swipeFor(nextCardIn(QUIZ, swipes)!, "yes"));
    expect(answersOf(swipes)).toEqual({ taste: ["sour"] });
    expect(nextCardIn(QUIZ, swipes)?.id).toBe("pace");
  });

  it("stops a yes/no list at its limit", () => {
    const swipes = play((card) => (card.kind === "yesno" ? "no" : card.kind === "versus" ? "left" : card.kind === "gate" ? "no" : "skip"));
    expect(swipes.filter((s) => s.question === "taste").map((s) => s.card)).toEqual(["taste:sweet", "taste:sour", "taste:salty"]);
  });

  it("orders yes/no answers by the fit, keeping written order on ties", () => {
    const seen: QuizSwipe["answers"][] = [];
    const fit = (o: AnswerOption, answers: QuizSwipe["answers"]) => {
      seen.push(answers);
      return o.id === "salty" || o.id === "bitter" ? 1 : 0;
    };
    expect(nextCardIn(QUIZ, [], fit)?.id).toBe("taste:salty");
    const swipes = [swipeFor(nextCardIn(QUIZ, [], fit)!, "no")];
    expect(nextCardIn(QUIZ, swipes, fit)?.id).toBe("taste:bitter");
    // The fit sees the answers so far (a "no" adds none).
    expect(seen.at(-1)).toEqual({});
    // Versus and pick cards ignore the fit.
    expect(nextCardIn(QUIZ, [swipeFor(nextCardIn(QUIZ, [])!, "yes")], () => 5)?.id).toBe("pace");
  });

  it("turns versus sides, the middle included, into answers", () => {
    const before = [swipeFor(nextCardIn(QUIZ, [])!, "yes")];
    const pace = nextCardIn(QUIZ, before)!;
    expect(pace.kind).toBe("versus");
    expect(pace.kind === "versus" && [pace.left.id, pace.right.id, pace.middle?.id]).toEqual(["slow", "fast", "mixed"]);
    expect(swipeFor(pace, "middle").answers).toEqual({ pace: ["mixed"] });
    expect(nextCardIn(QUIZ, [...before, swipeFor(pace, "right")])?.id).toBe("pets:gate");
  });

  it("skips a gated pick list on no and answers it with its exclusive options", () => {
    const before = [swipeFor(nextCardIn(QUIZ, [])!, "yes")];
    before.push(swipeFor(nextCardIn(QUIZ, before)!, "left"));
    const gate = nextCardIn(QUIZ, before)!;
    expect(gate.kind).toBe("gate");
    const declined = [...before, swipeFor(gate, "no")];
    expect(answersOf(declined).pets).toEqual(["none"]);
    expect(nextCardIn(QUIZ, declined)?.id).toBe("drink");

    const accepted = [...before, swipeFor(gate, "yes")];
    const pets = nextCardIn(QUIZ, accepted)!;
    expect(pets.kind).toBe("pick");
    expect(swipeFor(pets, "done", { pets: ["cat", "dog"] }).answers).toEqual({ pets: ["cat", "dog"] });
    expect(nextCardIn(QUIZ, [...accepted, swipeFor(pets, "skip")])?.id).toBe("drink");
  });

  it("ends after the last question and reports progress per question", () => {
    const swipes = play((card) => (card.kind === "yesno" || card.kind === "gate" ? "yes" : card.kind === "versus" ? "right" : "done"), {
      pets: ["dog"],
      drink: ["tea"],
    });
    expect(nextCardIn(QUIZ, swipes)).toBeNull();
    expect(swipes.map((s) => s.card)).toEqual(["taste:sweet", "pace", "pets:gate", "pets", "drink"]);
    expect(answersOf(swipes)).toEqual({ taste: ["sweet"], pace: ["fast"], pets: ["dog"], drink: ["tea"] });
    expect(pickedOptionsIn(QUIZ, answersOf(swipes)).map((p) => p.options.map((o) => o.label))).toEqual([["SWEET"], ["FAST"], ["DOG"], ["TEA"]]);

    expect(progressIn(QUIZ, nextCardIn(QUIZ, [])!)).toEqual({ step: 1, total: 4 });
    expect(progressIn(QUIZ, nextCardIn(QUIZ, swipes.slice(0, 3))!)).toEqual({ step: 3, total: 4 });
  });

  it("returns null for an empty quiz", () => {
    expect(nextCardIn([], [])).toBeNull();
  });
});
