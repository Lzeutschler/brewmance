import type { Color } from "@/lib/cards/types";
import type { ArchetypeId } from "@/lib/tagging/archetypes";

import { QUESTIONS, TRACK_QUESTION } from "./questions";
import { buildProfile } from "./scoring";
import type { AnswerEffect, AnswerOption, Answers, Question, QuizProfile, QuizSwipe, Track } from "./types";

/** The quiz card on top of the deck, ready to render. */
export type QuizCard =
  | { kind: "yesno"; id: string; question: Question; option: AnswerOption }
  | { kind: "gate"; id: string; question: Question; title: string; description: string; art: string }
  | { kind: "versus"; id: string; question: Question; left: AnswerOption; right: AnswerOption; middle?: AnswerOption }
  | { kind: "pick"; id: string; question: Question };

/** The first card: which track of questions follows. */
export function trackCard(): QuizCard {
  return versusCard(TRACK_QUESTION);
}

/**
 * The next card for the swipes so far, or null once every question is answered. Yes/no questions
 * show their answers that fit the earlier swipes best first and stop early, gates skip whole lists,
 * so the deck stays short and only asks what still matters.
 */
export function nextCard(track: Track, swipes: QuizSwipe[]): QuizCard | null {
  const questions = QUESTIONS[track];
  let profile: QuizProfile | null = null;
  return nextCardIn(questions, swipes, (o, answers) => affinity(o.effect, (profile ??= buildProfile(track, questions, answers))));
}

/**
 * The next card of any question list, or null once every question is answered. `fit` ranks the open
 * answers of a yes/no question (higher first, given the answers so far); without it they keep the
 * order they are written in.
 */
export function nextCardIn(
  questions: Question[],
  swipes: QuizSwipe[],
  fit?: (option: AnswerOption, answers: Answers) => number,
): QuizCard | null {
  let answers: Answers | null = null;
  for (const question of questions) {
    const own = swipes.filter((s) => s.question === question.id);
    // A card with the question's own id answers it whole (pick and versus cards).
    if (own.some((s) => s.card === question.id)) continue;

    const card = question.card;
    if (card.kind === "versus") return versusCard(question);
    if (card.kind === "pick") {
      const gate = own.find((s) => s.card === gateId(question));
      if (card.gate && !gate) return { kind: "gate", id: gateId(question), question, ...card.gate };
      if (gate?.choice === "no") continue;
      return { kind: "pick", id: question.id, question };
    }

    const yeses = own.filter((s) => s.choice === "yes").length;
    if (yeses >= question.max || own.length >= (card.limit ?? Infinity)) continue;
    const shown = new Set(own.map((s) => s.card));
    const open = question.options.filter((o) => !o.exclusive && !shown.has(yesNoId(question, o)));
    if (!open.length) continue;
    let option = open[0];
    if (fit) {
      answers ??= answersOf(swipes);
      const score = (o: AnswerOption) => fit(o, answers!);
      // Sort is stable: equally fitting answers keep the order they are written in.
      option = [...open].sort((a, b) => score(b) - score(a))[0];
    }
    return { kind: "yesno", id: yesNoId(question, option), question, option };
  }
  return null;
}

/** The answers that `choice` on `card` gives. */
export function swipeFor(card: QuizCard, choice: QuizSwipe["choice"], picked: Answers = {}): QuizSwipe {
  const q = card.question.id;
  const answers: Answers =
    card.kind === "yesno"
      ? choice === "yes" ? { [q]: [card.option.id] } : {}
      : card.kind === "gate"
        ? choice === "no" ? { [q]: card.question.options.filter((o) => o.exclusive).map((o) => o.id) } : {}
        : card.kind === "versus"
          ? { [q]: [(choice === "left" ? card.left : choice === "right" ? card.right : card.middle!).id] }
          : choice === "done" ? picked : {};
  return { card: card.id, question: q, choice, answers };
}

/** All swipes' answers added up. */
export function answersOf(swipes: QuizSwipe[]): Answers {
  const answers: Answers = {};
  for (const swipe of swipes) {
    for (const [question, ids] of Object.entries(swipe.answers)) answers[question] = [...(answers[question] ?? []), ...ids];
  }
  return answers;
}

/** Position of the card's question in its track, for the progress bar. */
export function deckProgress(track: Track, card: QuizCard): { step: number; total: number } {
  return progressIn(QUESTIONS[track], card);
}

/** Position of the card's question in a question list, for the progress bar. */
export function progressIn(questions: Question[], card: QuizCard): { step: number; total: number } {
  return { step: questions.findIndex((q) => q.id === card.question.id) + 1, total: questions.length };
}

/** What the player said yes to, per question, in quiz order; follow-up answers come with their question. */
export function pickedOptions(track: Track, answers: Answers): { question: Question; options: AnswerOption[] }[] {
  return pickedOptionsIn(QUESTIONS[track], answers);
}

/** `pickedOptions` for any question list. */
export function pickedOptionsIn(questions: Question[], answers: Answers): { question: Question; options: AnswerOption[] }[] {
  return questions.map((question) => ({
    question,
    options: [question, ...(question.followUp ? [question.followUp] : [])].flatMap((q) =>
      (answers[q.id] ?? []).map((id) => q.options.find((o) => o.id === id)).filter((o): o is AnswerOption => Boolean(o)),
    ),
  }));
}

/** How well an answer fits the profile so far: shared archetypes, creature types and color leanings. */
function affinity(effect: AnswerEffect, profile: QuizProfile): number {
  let fit = 0;
  for (const [id, weight] of Object.entries(effect.archetypes ?? {}) as [ArchetypeId, number][]) {
    fit += weight * (profile.archetypes[id] ?? 0);
  }
  for (const tribe of effect.tribes ?? []) if (profile.creatureLean.includes(tribe)) fit += 3;
  for (const [color, weight] of Object.entries(effect.colorLean ?? {}) as [Color, number][]) {
    fit += weight * (profile.colorLean[color] ?? 0);
  }
  return fit;
}

/** The card for a versus question: its left, right and optional middle answers. */
export function versusCard(question: Question): QuizCard {
  if (question.card.kind !== "versus") throw new Error(`${question.id} is not a versus question`);
  const option = (id: string) => question.options.find((o) => o.id === id)!;
  const { left, right, middle } = question.card;
  return { kind: "versus", id: question.id, question, left: option(left), right: option(right), middle: middle ? option(middle) : undefined };
}

const gateId = (question: Question) => `${question.id}:gate`;
const yesNoId = (question: Question, option: AnswerOption) => `${question.id}:${option.id}`;
