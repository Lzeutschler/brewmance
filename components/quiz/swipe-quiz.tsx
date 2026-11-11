"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CardBack } from "@/components/card/card-back";
import { HeartBurst } from "@/components/cauldron";
import { ArrowUUpLeftIcon } from "@/components/icons";
import { useSwipeKeys } from "@/components/swipe/swipe-controls";
import { Button } from "@/components/ui/button";
import { artCropUrl } from "@/lib/cards/image";
import { answersOf, nextCardIn, progressIn, swipeFor } from "@/lib/quiz/deck";
import type { AnswerOption, Answers, Question, QuizChoice, QuizSwipe } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

import { artOf, AUTO_DONE_MS, CardButtons, choiceFor, choicesOf, DIRECTIONS, hintFor } from "./deck-parts";
import { QuizSwipeCard } from "./quiz-card";

/**
 * A short swipe quiz over any question list, with the look and controls of the commander quiz.
 * Its answers live in local state only (nothing is saved). Once every question is answered it calls
 * `onFinish` once and renders nothing, so the caller shows the result in its place.
 *
 * - Pass `questions` (and `fit`, if any) as stable values, e.g. module constants: the deck is
 *   recomputed when they change.
 * - To start over, remount it with a new `key` from the caller.
 * - Only one swipe deck may be on a page at a time, since the arrow keys are bound to the window.
 */
export function SwipeQuiz({
  questions,
  onFinish,
  fit,
  label,
  progressTestId,
  cardTestId,
}: {
  questions: Question[];
  /** Called once with the added-up answers and every swipe, after the last card. */
  onFinish: (answers: Answers, swipes: QuizSwipe[]) => void;
  /** Orders the answers of yes/no questions (higher first); without it they keep their written order. */
  fit?: (option: AnswerOption, answers: Answers) => number;
  /** Accessible name of the quiz region. */
  label?: string;
  /** Test id for the "1 / 5" progress text; none by default. */
  progressTestId?: string;
  /** Test id for the top card; none by default. */
  cardTestId?: string;
}) {
  const [swipes, setSwipes] = useState<QuizSwipe[]>([]);
  const card = useMemo(() => nextCardIn(questions, swipes, fit), [questions, swipes, fit]);

  const [last, setLast] = useState<{ card: string; choice: QuizChoice } | null>(null);
  const [picks, setPicks] = useState<{ card: string; answers: Answers }>({ card: "", answers: {} });
  const [hinted, setHinted] = useState<string[]>([]);
  const autoDone = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);
  const picked = card && picks.card === card.id ? picks.answers : {};

  // Warm the art of the cards that can come next.
  useEffect(() => {
    const next = !card ? [] : choicesOf(card).map((choice) => nextCardIn(questions, [...swipes, swipeFor(card, choice)], fit));
    for (const art of next.flatMap(artOf)) new Image().src = artCropUrl(art);
  }, [card, questions, swipes, fit]);

  // Hand the answers over once, when the last card is gone.
  useEffect(() => {
    if (card || finished.current) return;
    finished.current = true;
    onFinish(answersOf(swipes), swipes);
  }, [card, swipes, onFinish]);

  useEffect(() => {
    const timer = autoDone;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  /** Adds the swipe unless its card is already answered (a key press racing the auto-done tap). */
  const add = (swipe: QuizSwipe) => setSwipes((all) => (all.some((s) => s.card === swipe.card) ? all : [...all, swipe]));
  const clearAutoDone = () => {
    if (autoDone.current) clearTimeout(autoDone.current);
    autoDone.current = null;
  };

  const answer = (choice: QuizChoice) => {
    if (!card || !choicesOf(card).includes(choice)) return;
    if (choice === "done" && !picked[card.question.id]?.length) return;
    clearAutoDone();
    setLast({ card: card.id, choice });
    const hint = hintFor(card);
    setHinted((hints) => (hints.includes(hint) ? hints : [...hints, hint]));
    add(swipeFor(card, choice, picked));
  };
  const undo = () => {
    clearAutoDone();
    setLast(null);
    setSwipes((all) => all.slice(0, -1));
  };
  const toggle = (question: Pick<Question, "id" | "max" | "options">, optionId: string) => {
    if (!card) return;
    const current = picked[question.id] ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current.slice(Math.max(0, current.length - question.max + 1)), optionId];
    const answers = { ...picked, [question.id]: next };
    setPicks({ card: card.id, answers });
    // A single-choice list is answered by the tap itself.
    clearAutoDone();
    if (card.kind === "pick" && question.id === card.question.id && card.question.max === 1 && next.length) {
      autoDone.current = setTimeout(() => {
        autoDone.current = null;
        setLast({ card: card.id, choice: "done" });
        add(swipeFor(card, "done", answers));
      }, AUTO_DONE_MS);
    }
  };

  useSwipeKeys((decision) => {
    if (!card) return;
    const kind = card.kind;
    if (decision === "pick") answer(kind === "versus" ? "right" : kind === "pick" ? "done" : "yes");
    else if (decision === "pass") answer(kind === "versus" ? "left" : kind === "pick" ? "skip" : "no");
    else answer("middle");
  }, undo);

  if (!card) return null;

  const progress = progressIn(questions, card);
  const exit = last ? (DIRECTIONS[last.choice] ?? null) : null;
  const canFinish = card.kind !== "pick" || (picked[card.question.id]?.length ?? 0) > 0;

  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-4 pt-4 pb-8 select-none sm:gap-5 sm:pt-6"
    >
      <div className="flex w-full items-center gap-3">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!swipes.length} className="-ml-2 text-muted-foreground">
          <ArrowUUpLeftIcon /> Undo
        </Button>
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: progress.total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)] transition-colors duration-500",
                i < progress.step - 1 && "bg-brand",
                i === progress.step - 1 && "bg-brand/45",
              )}
            />
          ))}
        </div>
        <span className="ui-label w-10 text-right text-muted-foreground tabular-nums" data-testid={progressTestId}>
          {`${progress.step} / ${progress.total}`}
        </span>
      </div>

      <div className="relative aspect-[488/680] w-[min(400px,88vw,calc((100dvh-17rem)*0.7176))] min-w-60">
        <CardBack className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 opacity-50" />
        <CardBack className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 opacity-80" />
        <AnimatePresence custom={exit} initial={false}>
          <QuizSwipeCard
            key={card.id}
            card={card}
            picked={picked}
            onToggle={toggle}
            onSwipe={(direction) => answer(choiceFor(card, direction))}
            testId={cardTestId ?? null}
          />
        </AnimatePresence>
        {last && (last.choice === "yes" || last.choice === "done") && <HeartBurst key={last.card} />}
      </div>

      <CardButtons card={card} canFinish={canFinish} onAnswer={answer} />
      {!hinted.includes(hintFor(card)) && <p className="text-center text-xs text-muted-foreground">{hintFor(card)}</p>}
    </div>
  );
}
