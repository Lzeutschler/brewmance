"use client";

import { motion } from "motion/react";

import { ManaSymbol } from "@/components/card/mana";
import { HeartShape } from "@/components/cauldron";
import { ArrowRightIcon, ArrowUUpLeftIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { artCropUrl, cardImageUrl } from "@/lib/cards/image";
import { takesSecondCommander } from "@/lib/cards/pairing";
import { useCommanderInsights } from "@/lib/data/client";
import { pickedOptions } from "@/lib/quiz/deck";
import type { Track } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import { useQuizAnswers, useQuizStore } from "@/stores/quiz";

import { useQuizRanking } from "./use-quiz-ranking";

/** After the last question: your answers and your best commander meet, like a match on a dating app. */
export function QuizMatch({ track }: { track: Track }) {
  const { ranked, isLoading, error } = useQuizRanking(track);
  const answers = useQuizAnswers();
  const startSwiping = useQuizStore((s) => s.startSwiping);
  const undoSwipe = useQuizStore((s) => s.undoSwipe);

  const liked = pickedOptions(track, answers).flatMap((p) => p.options.map((option) => ({ key: `${p.question.id}:${option.id}`, option })));
  const vibe = liked.find((l) => l.option.art)?.option.art;
  const top = ranked[0];
  // A commander that takes a partner meets its favorite one too.
  const pairing = useCommanderInsights(top && takesSecondCommander(top.commander) ? top.commander.name : null).data?.pairings[0];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <div className="flex items-center justify-center">
        <Avatar src={vibe ? artCropUrl(vibe) : null} from={-80} rotate={-7} />
        <motion.div
          className="relative z-10 -mx-5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.35 }}
        >
          <HeartShape className="w-14 animate-[brew-bob_3s_ease-in-out_infinite] drop-shadow-[0_4px_6px_oklch(0_0_0/60%)] sm:w-16" />
        </motion.div>
        <Avatar src={top?.commander.image ? cardImageUrl(top.commander.image, "art_crop") : null} from={80} rotate={7} />
      </div>

      <motion.div className="space-y-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="text-5xl font-semibold text-[var(--heart)] italic sm:text-6xl">It&apos;s a match!</h1>
        {error ? (
          <p className="text-destructive">Could not load commanders: {error.message}</p>
        ) : top ? (
          <>
            <p className="text-lg text-muted-foreground">
              You and <span className="font-semibold text-foreground">{top.commander.name}</span> swiped right on each other.
            </p>
            {pairing && (
              <p className="text-sm text-muted-foreground" data-testid="match-pairing">
                Best paired with <span className="font-semibold text-foreground">{pairing.name}</span> (
                {pairing.deckCount.toLocaleString("en-US")} decks)
              </p>
            )}
            {top.reasons.length > 0 && (
              <ul className="mx-auto flex max-w-md flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
                {top.reasons.slice(0, 2).map((reason) => (
                  <li key={reason.text} className="flex items-center gap-1.5">
                    <CheckIcon className="size-4 shrink-0 text-teal" aria-hidden />
                    {reason.text}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-lg text-muted-foreground">{isLoading ? "Brewing commanders that fit you…" : "No commanders found."}</p>
        )}
      </motion.div>

      {liked.length > 0 && (
        <motion.ul
          className="flex max-w-md flex-wrap justify-center gap-1.5"
          aria-label="You swiped right on"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {liked.map(({ key, option }) => (
            <li
              key={key}
              className={cn(
                "flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pr-3 text-sm shadow-sm",
                option.art || option.symbol ? "pl-0.5" : "pl-3",
              )}
            >
              {option.symbol ? (
                <ManaSymbol symbol={option.symbol} className="size-6" />
              ) : (
                option.art && (
                  // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
                  <img src={artCropUrl(option.art)} alt="" className="size-6 rounded-full object-cover" />
                )
              )}
              {option.label}
            </li>
          ))}
        </motion.ul>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          onClick={() => {
            window.scrollTo({ top: 0 });
            startSwiping();
          }}
          disabled={!top}
        >
          Meet your commanders <ArrowRightIcon />
        </Button>
        <Button variant="ghost" onClick={undoSwipe} className="text-muted-foreground">
          <ArrowUUpLeftIcon /> Change my last answer
        </Button>
      </div>
    </div>
  );
}

function Avatar({ src, from, rotate }: { src: string | null; from: number; rotate: number }) {
  return (
    <motion.div
      className={cn("size-32 overflow-hidden rounded-full border-4 border-ink bg-card shadow-xl ring-2 ring-brand sm:size-40", !src && "animate-pulse")}
      initial={{ x: from, opacity: 0, rotate: 0 }}
      animate={{ x: 0, opacity: 1, rotate }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
        <img src={src} alt="" className="size-full object-cover" />
      )}
    </motion.div>
  );
}
