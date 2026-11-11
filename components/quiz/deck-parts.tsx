"use client";

import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, HeartIcon, XIcon } from "@/components/icons";
import { RoundButton } from "@/components/swipe/swipe-controls";
import { Button } from "@/components/ui/button";
import type { QuizCard } from "@/lib/quiz/deck";
import type { QuizChoice } from "@/lib/quiz/types";

import type { SwipeDirection } from "./quiz-card";

// Shared pieces of the quiz decks: the commander quiz (QuizDeck) and the smaller swipe quizzes (SwipeQuiz).

/** Delay before a single-choice pick card flies off, so the tapped tile shows as picked. */
export const AUTO_DONE_MS = 260;

export const DIRECTIONS: Partial<Record<QuizChoice, SwipeDirection>> = {
  yes: "right",
  right: "right",
  done: "right",
  no: "left",
  left: "left",
  skip: "left",
  middle: "up",
};

export function CardButtons({
  card,
  canFinish,
  onAnswer,
}: {
  card: QuizCard;
  canFinish: boolean;
  onAnswer: (choice: QuizChoice) => void;
}) {
  if (card.kind === "versus") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={() => onAnswer("left")} className="h-auto min-h-12 justify-start py-2 text-left whitespace-normal">
            <ArrowLeftIcon className="text-brand" /> {card.left.label}
          </Button>
          <Button variant="outline" size="lg" onClick={() => onAnswer("right")} className="h-auto min-h-12 justify-end py-2 text-right whitespace-normal">
            {card.right.label} <ArrowRightIcon className="text-brand" />
          </Button>
        </div>
        {card.middle && (
          <Button variant="ghost" size="sm" onClick={() => onAnswer("middle")} className="text-muted-foreground">
            <ArrowUpIcon className="text-maybe" /> {card.middle.label}
          </Button>
        )}
      </div>
    );
  }
  const pick = card.kind === "pick";
  return (
    <div className="flex items-center gap-6">
      <RoundButton label={pick ? "Skip (←)" : "No (←)"} onClick={() => onAnswer(pick ? "skip" : "no")} className="size-16 border-pass/70 text-pass hover:bg-pass/15">
        <XIcon className="size-8" />
      </RoundButton>
      {!(pick && card.question.max === 1) && (
        <RoundButton
          label={pick ? "Done (→)" : "Yes (→)"}
          onClick={() => onAnswer(pick ? "done" : "yes")}
          disabled={!canFinish}
          className="size-16 border-pick/70 text-pick hover:bg-pick/15"
        >
          <HeartIcon className="size-8" />
        </RoundButton>
      )}
    </div>
  );
}

/** How to answer the card; each hint shows until the first card it explains is answered. */
export function hintFor(card: QuizCard): string {
  if (card.kind === "versus") return card.middle ? "Swipe toward your pick, or up for the one in between" : "Swipe toward your pick";
  if (card.kind === "pick") return card.question.max === 1 ? "Tap the one that speaks to you" : "Tap your favorites, then the heart";
  return "Swipe right for yes, left for no";
}

export function choicesOf(card: QuizCard): QuizChoice[] {
  if (card.kind === "versus") return card.middle ? ["left", "right", "middle"] : ["left", "right"];
  if (card.kind === "pick") return ["done", "skip"];
  return ["yes", "no"];
}

export function choiceFor(card: QuizCard, direction: SwipeDirection): QuizChoice {
  if (card.kind === "versus") return direction === "up" ? "middle" : direction;
  return direction === "right" ? "yes" : "no";
}

/** Art crops a card shows, to load them ahead. */
export function artOf(card: QuizCard | null): string[] {
  if (!card) return [];
  const arts =
    card.kind === "yesno"
      ? [card.option.art]
      : card.kind === "gate"
        ? [card.art]
        : card.kind === "versus"
          ? [card.left.art, card.right.art]
          : card.question.options.map((o) => o.art);
  return arts.filter((art): art is string => Boolean(art));
}
