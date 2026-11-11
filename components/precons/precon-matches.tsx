"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { ColorIdentity, ManaSymbol } from "@/components/card/mana";
import { ArrowCounterClockwiseIcon, ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { artCropUrl, cardImageUrl } from "@/lib/cards/image";
import type { SluggedPrecon } from "@/lib/precons/slug";
import type { PreconMatch } from "@/lib/quiz/precon-quiz";
import type { AnswerOption } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

const COUNT_WORDS = ["No decks", "One deck", "Two decks", "Three decks", "Four decks", "Five decks"];

/**
 * The finder's result in place of the finished deck: the answers as chips, then the best precons as tiles with
 * their match and why they fit, each linking to the precon's page.
 */
export function PreconMatches({
  matches,
  liked,
  onRestart,
}: {
  matches: PreconMatch<SluggedPrecon>[];
  /** The answers the player picked, shown as chips. */
  liked: { key: string; option: AnswerOption }[];
  onRestart: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  // The deck is gone: bring keyboard and screen reader users to the result.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  const top = matches[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6 px-4 pt-8 pb-12 sm:pt-12">
      <div className="animate-[brew-rise_300ms_ease-out_both] space-y-3 text-center motion-reduce:animate-none">
        <h2 ref={heading} tabIndex={-1} className="text-4xl leading-none font-medium outline-none sm:text-5xl">
          {COUNT_WORDS[matches.length] ?? `${matches.length} decks`} for you
        </h2>
        <p className="text-muted-foreground">Ready-to-play decks, best match first.</p>
      </div>

      {liked.length > 0 && (
        <ul className="flex max-w-xl flex-wrap justify-center gap-1.5" aria-label="Your answers">
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
        </ul>
      )}

      <ol className="flex w-full flex-wrap justify-center gap-3 sm:gap-4">
        {matches.map((match, i) => (
          <li
            key={match.precon.slug}
            className="flex w-full animate-[brew-rise_300ms_ease-out_both] motion-reduce:animate-none sm:w-[calc((100%-2rem)/3)]"
            style={{ animationDelay: `${100 + i * 80}ms` }}
          >
            <MatchTile match={match} />
          </li>
        ))}
      </ol>

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {top && (
            <Button size="lg" nativeButton={false} render={<Link href={`/precons/${top.precon.slug}`} />}>
              See your best match <ArrowRightIcon />
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={onRestart}>
            <ArrowCounterClockwiseIcon /> Start over
          </Button>
        </div>
        <Link href="/precons" className="ui-label inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground">
          See all precons
        </Link>
      </div>
    </div>
  );
}

/** A precon tile (the markup of the precon list) with its match and reasons under the name plate. */
function MatchTile({ match }: { match: PreconMatch<SluggedPrecon> }) {
  const { precon, percent, reasons } = match;
  const colors = precon.colorIdentity.length ? precon.colorIdentity : ["C"];
  return (
    <Link
      href={`/precons/${precon.slug}`}
      className="panel flex w-full flex-col overflow-hidden p-2 text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70 motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-28 overflow-hidden rounded-md bg-muted">
        {precon.image && (
          // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
          <img src={cardImageUrl(precon.image, "art_crop")} alt="" className="size-full object-cover object-[center_25%]" />
        )}
        <span className="numeral absolute top-1.5 left-1.5 rounded-sm bg-ink/85 px-1.5 py-0.5 text-xs">{precon.releaseDate.slice(0, 4)}</span>
      </div>
      <div className="mt-2 flex h-1 gap-px overflow-hidden rounded-xs" aria-hidden="true">
        {colors.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: `var(--mana-${color.toLowerCase()})` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pt-2 pb-1">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg leading-tight font-medium">{precon.name}</h3>
            <ColorIdentity colors={precon.colorIdentity} className="mt-0.5 shrink-0" />
          </div>
          <p className="truncate text-xs text-muted-foreground">{precon.commanders.join(" & ")}</p>
        </div>
        <p className="mt-auto flex items-baseline gap-1.5">
          <span className="numeral text-2xl text-brand">{percent}%</span>
          <span className="ui-label text-muted-foreground">match</span>
        </p>
        <ul className="space-y-1 text-sm">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-1.5">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
