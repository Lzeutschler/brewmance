"use client";

import { useEffect, useMemo, useState } from "react";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { ColorIdentity, ManaCost } from "@/components/card/mana";
import { BrewLoader, Cauldron, CelebrationCauldron } from "@/components/cauldron";
import { EdhrecLink } from "@/components/edhrec-link";
import {
  ArrowCounterClockwiseIcon,
  ListChecksIcon,
  NotePencilIcon,
  CheckIcon,
} from "@/components/icons";
import { SwipeButtons, SwipeStack, useSwipeKeys } from "@/components/swipe/swipe-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { identityName } from "@/lib/cards/colors";
import { cardImageUrl } from "@/lib/cards/image";
import { pairingLabel } from "@/lib/cards/pairing";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import { pickedOptions } from "@/lib/quiz/deck";
import { FRANCHISE_LABELS, franchiseOf } from "@/lib/quiz/franchises";
import { topArchetypes } from "@/lib/quiz/scoring";
import type { PopularityMode, ScoredCommander, Track } from "@/lib/quiz/types";
import { ARCHETYPE_LABELS } from "@/lib/tagging/archetypes";
import { cn } from "@/lib/utils";
import { useQuizAnswers, useQuizStore } from "@/stores/quiz";

import { matchPercent, useQuizRanking } from "./use-quiz-ranking";

const POPULARITY_OPTIONS: { id: PopularityMode; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "balanced", label: "Balanced" },
  { id: "hidden", label: "Hidden gems" },
];

export function CommanderSwipe({ track }: { track: Track }) {
  const { ranked, byId, topScore, isLoading, error } = useQuizRanking(track);
  const decisions = useQuizStore((s) => s.decisions);
  const limit = useQuizStore((s) => s.limit);
  const decide = useQuizStore((s) => s.decide);
  const undoDecision = useQuizStore((s) => s.undo);
  const showShortlist = useQuizStore((s) => s.showShortlist);
  const keepSwiping = useQuizStore((s) => s.keepSwiping);
  const [lastDecision, setLastDecision] = useState<SwipeDecision | null>(null);

  const decided = useMemo(() => new Set(decisions.map((d) => d.commanderId)), [decisions]);
  const queue = useMemo(() => ranked.filter((r) => !decided.has(r.commander.id)), [ranked, decided]);
  const roundDone = decisions.length >= limit || (ranked.length > 0 && queue.length === 0);
  const current = roundDone ? null : (queue[0] ?? null);
  const shortlist = decisions.filter((d) => d.decision !== "pass").map((d) => ({ ...d, scored: byId.get(d.commanderId) }));

  // Warm the image cache for the next few commanders.
  useEffect(() => {
    for (const { commander } of queue.slice(1, 6)) {
      if (commander.image) new Image().src = cardImageUrl(commander.image, "large");
    }
  }, [queue]);

  const decideCurrent = (decision: SwipeDecision) => {
    if (!current) return;
    setLastDecision(decision);
    decide(current.commander.id, decision);
  };
  const undo = () => {
    setLastDecision(null);
    undoDecision();
  };
  useSwipeKeys(decideCurrent, undo);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BrewLoader>Brewing commanders that fit you…</BrewLoader>
      </div>
    );
  }
  if (error) return <p className="p-8 text-center text-destructive">Could not load commanders: {error.message}</p>;

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr_320px]">
      <aside className="order-3 space-y-5 lg:order-1">
        <AnswerSummary track={track} />
      </aside>

      <section className="order-1 flex flex-col items-center gap-5 select-none lg:order-2">
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <PopularityToggle />
          <p className="ui-label text-muted-foreground tabular-nums" data-testid="commander-count">
            {roundDone ? "Round complete" : `Commander ${decisions.length + 1} of ${limit}`}
          </p>
        </div>

        {current ? (
          <>
            <SwipeStack card={current.commander} cardKey={current.commander.id} lastDecision={lastDecision} onDecision={decideCurrent} />
            <SwipeButtons onDecision={decideCurrent} onUndo={undo} canUndo={decisions.length > 0} pickLabel="Shortlist" />
            <p className="hidden text-xs text-muted-foreground sm:block">Right = shortlist · Up = maybe · Left = pass · Z to undo</p>
          </>
        ) : (
          <RoundDone
            seen={decisions.length}
            shortlisted={shortlist.length}
            canContinue={queue.length > 0}
            onShortlist={showShortlist}
            onKeepSwiping={keepSwiping}
            onUndo={undo}
          />
        )}
      </section>

      <aside className="order-2 space-y-5 lg:order-3">
        {current && <WhyThisFits scored={current} topScore={topScore} />}

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="ui-label text-muted-foreground">Your shortlist</span>
            <span className="numeral text-xl" data-testid="shortlist-count">
              {shortlist.length}
            </span>
          </div>
          {shortlist.length === 0 ? (
            <p className="text-xs text-muted-foreground">Swipe right on commanders you like.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {shortlist
                .slice(-6)
                .reverse()
                .map(({ commanderId, decision, scored }) =>
                  scored ? (
                    <CardHoverPreview key={commanderId} card={scored.commander}>
                      <li className="flex items-center justify-between gap-2 min-h-10 rounded-md px-2 py-1.5 hover:bg-accent">
                        <span className={cn("truncate", decision === "maybe" && "text-maybe")}>{scored.commander.name}</span>
                        <ColorIdentity colors={scored.commander.colorIdentity} />
                      </li>
                    </CardHoverPreview>
                  ) : null,
                )}
            </ul>
          )}
          <Button variant="outline" className="w-full" onClick={showShortlist} disabled={shortlist.length === 0}>
            <ListChecksIcon /> Review shortlist
          </Button>
        </div>
      </aside>
    </div>
  );
}

function WhyThisFits({ scored, topScore }: { scored: ScoredCommander; topScore: number }) {
  const { commander, reasons } = scored;
  const franchise = franchiseOf(commander.set);
  const pairing = pairingLabel(commander);
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-2xl leading-tight font-medium">{commander.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{commander.typeLine}</p>
        </div>
        <ManaCost cost={commander.manaCost} className="shrink-0 pt-1" />
      </div>
      <div className="flex items-center gap-3">
        <div className="panel-inset px-3 py-2 text-center">
          <div className="numeral text-3xl text-brand">{matchPercent(scored.score, topScore)}%</div>
          <div className="ui-label mt-1 text-xs text-muted-foreground">match</div>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ColorIdentity colors={commander.colorIdentity} />
            {identityName(commander.colorIdentity)}
          </div>
          {commander.edhrecDecks !== null ? (
            <EdhrecLink href={edhrecCommanderUrl([commander])}>{commander.edhrecDecks.toLocaleString("en-US")} decks on EDHREC</EdhrecLink>
          ) : (
            <EdhrecLink href={edhrecCommanderUrl([commander])}>On EDHREC</EdhrecLink>
          )}
        </div>
      </div>
      <div>
        <h3 className="ui-label mb-2 text-muted-foreground">Why this fits</h3>
        <ul className="space-y-1.5 text-sm" data-testid="fit-reasons">
          {(reasons.length ? reasons.map((r) => r.text) : ["A solid all-rounder for your answers"]).map((text) => (
            <li key={text} className="flex gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {topArchetypes(commander).map((id) => (
          <Badge key={id} variant="secondary">
            {ARCHETYPE_LABELS[id]}
          </Badge>
        ))}
        {franchise !== "magic" && <Badge>{FRANCHISE_LABELS[franchise]}</Badge>}
        {pairing && <Badge variant="outline">{pairing}</Badge>}
      </div>
    </div>
  );
}

function PopularityToggle() {
  const popularity = useQuizStore((s) => s.popularity);
  const setPopularity = useQuizStore((s) => s.setPopularity);
  return (
    <div role="radiogroup" aria-label="Popularity" className="inline-flex gap-0.5 rounded-md border border-border bg-ink p-0.5 text-sm shadow-[inset_0_2px_0_0_oklch(0_0_0/30%)]">
      {POPULARITY_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={popularity === option.id}
          onClick={() => setPopularity(option.id)}
          className={cn(
            "min-h-9 rounded-sm px-3 font-semibold text-muted-foreground transition [font-stretch:92%] hover:text-foreground",
            popularity === option.id && "bg-secondary text-foreground shadow-sm",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AnswerSummary({ track }: { track: Track }) {
  const answers = useQuizAnswers();
  const reviseQuestion = useQuizStore((s) => s.reviseQuestion);
  const restart = useQuizStore((s) => s.restart);
  const picked = pickedOptions(track, answers);
  const revise = (questionId: string) => {
    window.scrollTo({ top: 0 });
    reviseQuestion(questionId);
  };

  return (
    <div className="panel space-y-4 p-5">
      <h2 className="ui-label text-muted-foreground">Your answers</h2>
      <ul className="space-y-2.5 text-sm">
        {picked.map(({ question, options }) => (
          <li key={question.id}>
            <button
              type="button"
              onClick={() => revise(question.id)}
              className="group -mx-2 w-[calc(100%+1rem)] rounded-md px-2 py-1 text-left hover:bg-accent"
            >
              <div className="ui-label text-muted-foreground group-hover:text-foreground">{question.title}</div>
              <div className="text-foreground/90">{options.length ? options.map((o) => o.label).join(", ") : "No preference"}</div>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => revise(picked[0].question.id)}>
          <NotePencilIcon /> Swipe the questions again
        </Button>
        <Button variant="ghost" onClick={restart} className="text-muted-foreground">
          <ArrowCounterClockwiseIcon /> Start over
        </Button>
      </div>
    </div>
  );
}

function RoundDone({
  seen,
  shortlisted,
  canContinue,
  onShortlist,
  onKeepSwiping,
  onUndo,
}: {
  seen: number;
  shortlisted: number;
  canContinue: boolean;
  onShortlist: () => void;
  onKeepSwiping: () => void;
  onUndo: () => void;
}) {
  return (
    <div className="panel flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
      {shortlisted ? (
        <CelebrationCauldron className="-mt-2 text-[4.5px]" />
      ) : (
        <Cauldron mood="empty" className="text-[4.5px]" />
      )}
      <h2 className="text-2xl font-medium">{shortlisted ? "It's a brew!" : "Nothing caught your eye?"}</h2>
      <p className="text-muted-foreground">
        You looked at {seen} commanders and kept {shortlisted}.{" "}
        {shortlisted ? "Choose one from your shortlist to build a deck." : "Keep swiping or change your answers."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="ghost" onClick={onUndo}>
          Undo
        </Button>
        {canContinue && (
          <Button variant="outline" onClick={onKeepSwiping}>
            Keep swiping
          </Button>
        )}
        <Button onClick={onShortlist} disabled={!shortlisted}>
          <ListChecksIcon /> Review shortlist
        </Button>
      </div>
    </div>
  );
}
