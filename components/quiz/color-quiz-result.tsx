import Link from "next/link";
import { useEffect, useRef } from "react";

import { ManaSymbol } from "@/components/card/mana";
import { ArrowCounterClockwiseIcon, ArrowRightIcon } from "@/components/icons";
import { Term } from "@/components/learn/learn-prose";
import { Button } from "@/components/ui/button";
import { COLOR_NAMES, identityName } from "@/lib/cards/colors";
import type { Color } from "@/lib/cards/types";
import { COLOR_PIE, combinationHref, combinationSentence, preconsHref, type GlossaryText } from "@/lib/quiz/color-quiz";

/**
 * The color quiz result: the combination's name and symbols, what each color stands for, and where to go next.
 * Rendered by `ColorQuiz` (a client component) in place of the finished deck.
 */
export function ColorQuizResult({ colors, onRestart }: { colors: Color[]; onRestart: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // The deck is gone: bring keyboard and screen reader users to the result.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-8 px-4 pt-8 pb-12 sm:pt-12">
      <div className="animate-[brew-rise_300ms_ease-out_both] space-y-3 text-center">
        <p className="ui-label text-muted-foreground">Your colors</p>
        <div className="flex justify-center gap-2" aria-hidden="true">
          {colors.map((c) => (
            <ManaSymbol key={c} symbol={c} className="size-10 sm:size-12" />
          ))}
        </div>
        <h2 ref={heading} tabIndex={-1} className="font-heading text-5xl leading-none font-medium outline-none sm:text-6xl">
          {identityName(colors)}
        </h2>
        <p className="text-muted-foreground">{combinationSentence(colors)}</p>
      </div>

      <ul className="w-full space-y-3">
        {colors.map((c, i) => (
          <li
            key={c}
            className="panel flex animate-[brew-rise_300ms_ease-out_both] gap-3 p-4 sm:p-5"
            style={{ animationDelay: `${100 + i * 80}ms` }}
          >
            <ManaSymbol symbol={c} className="mt-0.5 size-6" />
            <div className="min-w-0 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <h3 className="text-lg leading-tight font-medium text-foreground">{COLOR_NAMES[c]}</h3>
              <p>{COLOR_PIE[c].values}</p>
              <p>
                <WithTerms text={COLOR_PIE[c].games} />
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          A <Term id="precon">precon</Term> is a ready-to-play Commander deck you can buy in a store.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href={preconsHref(colors)} />}>
            Precons in your colors <ArrowRightIcon />
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/quiz" />}>
            Find your commander
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5">
          <Link href={combinationHref(colors)} className="ui-label inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground">
            Color combinations explained
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="ui-label inline-flex min-h-10 items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" aria-hidden /> Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function WithTerms({ text }: { text: GlossaryText }) {
  return text.map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <Term key={i} id={part.term}>
        {part.text}
      </Term>
    ),
  );
}
