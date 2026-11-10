"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { bottomCards, cardsToBottom, keepHand, mulligan } from "@/lib/goldfish/game";
import type { GameState } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

import { CardFace } from "./game-card";

/** Opening hand decision: keep or London mulligan, then pick cards for the bottom. */
export function MulliganOverlay({ game, act }: { game: GameState; act: (fn: (g: GameState) => GameState) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toBottom = cardsToBottom(game);
  const choosing = game.phase === "bottom";
  const hand = game.zones.hand.map((id) => game.cards[id]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < toBottom ? [...current, id] : current,
    );

  return (
    // Scrolls when the hand does not fit, e.g. on phones, instead of pushing the buttons off screen.
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center-safe gap-4 overflow-y-auto bg-ink/85 p-4 sm:gap-6 sm:p-6">
      <div className="text-center">
        <h2 className="text-2xl font-medium sm:text-4xl">{choosing ? `Put ${toBottom} on the bottom` : "Opening hand"}</h2>
        <p className="text-sm text-muted-foreground">
          {choosing
            ? `Choose ${toBottom} card${toBottom > 1 ? "s" : ""} to put on the bottom of your library.`
            : game.mulligans === 0
              ? "Your first mulligan is free."
              : `Mulligans: ${game.mulligans}. Keeping now puts ${toBottom} card${toBottom === 1 ? "" : "s"} on the bottom.`}
        </p>
        {!choosing && game.mulligans === 0 && (
          <p className="mt-1 text-xs text-muted-foreground sm:hidden">The table works best on a tablet or computer.</p>
        )}
      </div>

      {/* Phones get one row to scroll sideways, larger screens see the whole hand at once. */}
      <div className="flex w-full shrink-0 snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-1 pb-4 [--card-w:clamp(110px,36vw,150px)] sm:w-auto sm:snap-none sm:flex-wrap sm:justify-center sm:overflow-visible sm:p-0 sm:[--card-w:clamp(110px,min(12.5vw,30vh),240px)]">
        {hand.map((card, i) => (
          <button
            // A new key per mulligan deals the hand in again.
            key={`${game.mulligans}-${card.instanceId}`}
            type="button"
            disabled={!choosing}
            onClick={() => toggle(card.instanceId)}
            className={cn(
              "w-[var(--card-w)] shrink-0 snap-center animate-[brew-deal_0.45s_ease-out_both] rounded-[5%] transition",
              choosing && "hover:-translate-y-1",
              selected.includes(card.instanceId) && "translate-y-3 opacity-50 ring-3 ring-pass",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
            data-card-name={card.card.name}
          >
            <CardFace card={card} />
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {choosing ? (
          <Button
            size="lg"
            disabled={selected.length !== toBottom}
            onClick={() => {
              act((g) => bottomCards(g, selected));
              setSelected([]);
            }}
          >
            Confirm ({selected.length}/{toBottom})
          </Button>
        ) : (
          <>
            <Button size="lg" variant="outline" onClick={() => act(mulligan)} disabled={game.mulligans >= 6}>
              Mulligan <kbd className="ml-1 hidden text-xs opacity-60 sm:inline">M</kbd>
            </Button>
            <Button size="lg" onClick={() => act(keepHand)}>
              Keep {hand.length}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
