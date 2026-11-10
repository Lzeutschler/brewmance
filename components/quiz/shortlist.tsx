"use client";

import { useState } from "react";

import { CommanderSetup } from "@/components/build/commander-setup";
import { CardImage } from "@/components/card/card-image";
import { BrewLoader, EmptyCauldron } from "@/components/cauldron";
import { ArrowLeftIcon, CheckIcon, StarIcon, XIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import type { ScoredCommander, Track } from "@/lib/quiz/types";
import { sharedQuizText } from "@/lib/share/quiz";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz";

import { matchPercent, useQuizRanking } from "./use-quiz-ranking";

export function Shortlist({ track }: { track: Track }) {
  const { byId, topScore, isLoading } = useQuizRanking(track);
  const decisions = useQuizStore((s) => s.decisions);
  const keepSwiping = useQuizStore((s) => s.keepSwiping);
  const remove = useQuizStore((s) => s.removeFromShortlist);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = [...decisions.filter((d) => d.decision === "pick"), ...decisions.filter((d) => d.decision === "maybe")]
    .map((d) => ({ decision: d.decision, scored: byId.get(d.commanderId) }))
    .filter((e): e is { decision: typeof e.decision; scored: ScoredCommander } => Boolean(e.scored));
  const selected = entries.find((e) => e.scored.commander.id === selectedId)?.scored ?? entries[0]?.scored ?? null;
  // A shared result leads with the commander on screen, then the rest of the shortlist by match.
  const shared = selected
    ? [selected, ...entries.map((e) => e.scored).filter((s) => s !== selected).sort((a, b) => b.score - a.score)]
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BrewLoader />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title="Your shortlist"
        description="Choose your commander, set a power level and start swiping cards for its 99."
        actions={
          <div className="flex flex-wrap gap-2">
            {shared.length > 0 && (
              <ShareButton
                route="/q"
                text={sharedQuizText({
                  track,
                  matches: shared.map((scored) => ({
                    name: scored.commander.name,
                    percent: matchPercent(scored.score, topScore),
                    reasons: scored.reasons.map((r) => r.text),
                  })),
                })}
                title="My Commander matches"
                description="Anyone with the link sees your matches and can take the quiz."
              />
            )}
            <Button variant="outline" onClick={keepSwiping}>
              <ArrowLeftIcon /> Keep swiping
            </Button>
          </div>
        }
      />

      {selected ? (
        <CommanderSetup
          key={selected.commander.id}
          commander={selected.commander}
          onClose={() => remove(selected.commander.id)}
          closeLabel="Remove from shortlist"
        >
          <ul className="space-y-1.5 text-sm">
            <li className="font-semibold text-brand">
              {matchPercent(selected.score, topScore)}% match
            </li>
            {selected.reasons.map((reason) => (
              <li key={reason.text} className="flex gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
                {reason.text}
              </li>
            ))}
          </ul>
        </CommanderSetup>
      ) : (
        <EmptyCauldron
          title="No sparks yet"
          description="Your shortlist is empty. Swipe right on commanders you like."
          actions={<Button onClick={keepSwiping}>Back to swiping</Button>}
        />
      )}

      {entries.length > 1 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-medium">Or choose another</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {entries.map(({ decision, scored }) => {
              const { commander } = scored;
              const active = commander.id === selected?.commander.id;
              return (
                <div key={commander.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(commander.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-pressed={active}
                    aria-label={commander.name}
                    className={cn(
                      "block w-full rounded-[5%] ring-3 ring-transparent ring-offset-2 ring-offset-background transition hover:-translate-y-1",
                      active && "ring-brand",
                    )}
                  >
                    <CardImage card={commander} size="normal" />
                  </button>
                  <div className="mt-1 flex items-center justify-between gap-1 text-xs text-muted-foreground tabular-nums">
                    <span className="flex items-center gap-1">
                      {decision === "maybe" && <StarIcon className="size-3.5 text-maybe" />}
                      {matchPercent(scored.score, topScore)}% match
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(commander.id)}
                      className="-mr-2 grid size-10 place-items-center rounded-md hover:bg-accent hover:text-foreground"
                      aria-label={`Remove ${commander.name} from shortlist`}
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
