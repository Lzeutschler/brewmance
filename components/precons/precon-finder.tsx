"use client";

import { useCallback, useMemo, useState } from "react";

import { BrewLoader } from "@/components/cauldron";
import { SwipeQuiz } from "@/components/quiz/swipe-quiz";
import { useCommanders, usePrecons } from "@/lib/data/client";
import { withSlugs } from "@/lib/precons/slug";
import { pickedOptionsIn } from "@/lib/quiz/deck";
import { preconQuestions, rankPrecons, topPreconMatches } from "@/lib/quiz/precon-quiz";
import type { Answers } from "@/lib/quiz/types";

import { PreconMatches } from "./precon-matches";

/**
 * "Find your precon": a short swipe quiz, then the precons that fit the answers best. Nothing is saved; the
 * quiz starts as soon as the precon list is in, and the commanders it scores with load meanwhile.
 */
export function PreconFinder() {
  const precons = usePrecons();
  const commanders = useCommanders();
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<Answers | null>(null);

  // The same slugs as the precon pages: assigned over the whole list, newest first.
  const list = useMemo(() => (precons.data ? withSlugs(precons.data) : null), [precons.data]);
  const questions = useMemo(() => (list?.length ? preconQuestions(list) : null), [list]);
  const onFinish = useCallback((finished: Answers) => setAnswers(finished), []);

  const matches = useMemo(
    () => (answers && list && commanders.data ? topPreconMatches(rankPrecons(list, commanders.data, answers)) : null),
    [answers, list, commanders.data],
  );
  const liked = useMemo(
    () =>
      answers && questions
        ? pickedOptionsIn(questions, answers).flatMap((p) =>
            p.options.filter((option) => !option.exclusive).map((option) => ({ key: `${p.question.id}:${option.id}`, option })),
          )
        : [],
    [answers, questions],
  );

  const restart = () => {
    window.scrollTo({ top: 0 });
    setAnswers(null);
    setRound((r) => r + 1);
  };

  const error = precons.error ?? (answers ? commanders.error : null);
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">Could not load the precons: {error.message}</p>
      </div>
    );
  }
  if (precons.data && !questions) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No precons to choose from yet.</p>
      </div>
    );
  }
  if (!questions || (answers && !matches)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BrewLoader />
      </div>
    );
  }
  if (answers && matches) return <PreconMatches matches={matches} liked={liked} onRestart={restart} />;
  return <SwipeQuiz key={round} questions={questions} onFinish={onFinish} label="Precon finder" />;
}
