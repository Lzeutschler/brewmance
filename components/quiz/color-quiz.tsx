"use client";

import { useCallback, useState } from "react";

import type { Color } from "@/lib/cards/types";
import { COLOR_QUESTIONS, colorQuizResult } from "@/lib/quiz/color-quiz";
import type { Answers } from "@/lib/quiz/types";

import { ColorQuizResult } from "./color-quiz-result";
import { SwipeQuiz } from "./swipe-quiz";

/** The color quiz at /quiz/colors: a few swipe cards, then the colors they lean toward. Nothing is saved. */
export function ColorQuiz() {
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<Color[] | null>(null);
  const finish = useCallback((answers: Answers) => setResult(colorQuizResult(answers)), []);

  if (result) {
    return (
      <ColorQuizResult
        colors={result}
        onRestart={() => {
          window.scrollTo({ top: 0 });
          setResult(null);
          setRound((r) => r + 1);
        }}
      />
    );
  }
  return <SwipeQuiz key={round} questions={COLOR_QUESTIONS} onFinish={finish} label="Color quiz" />;
}
