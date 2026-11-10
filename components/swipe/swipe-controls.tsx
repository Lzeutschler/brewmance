"use client";

import { AnimatePresence } from "motion/react";
import { useEffect } from "react";

import { CardBack } from "@/components/card/card-back";
import { HeartBurst } from "@/components/cauldron";
import { ArrowUUpLeftIcon, HeartIcon, StarIcon, XIcon } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CardDisplay } from "@/lib/cards/types";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { cn } from "@/lib/utils";

import { SwipeCard, type SwipeLabels } from "./swipe-card";

/** Card stack with the top card draggable. `lastDecision` steers the exit animation; a pick bursts into hearts. */
export function SwipeStack({
  card,
  cardKey,
  lastDecision,
  onDecision,
  className,
  labels,
}: {
  card: CardDisplay;
  cardKey: string;
  lastDecision: SwipeDecision | null;
  onDecision: (decision: SwipeDecision) => void;
  /** E.g. a smaller width where more controls share the screen with the card. */
  className?: string;
  labels?: SwipeLabels;
}) {
  return (
    <div className={cn("relative aspect-[488/680] w-[min(400px,84vw,calc((100dvh-18rem)*0.7176))] min-w-48", className)}>
      <CardBack className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 opacity-50" />
      <CardBack className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 opacity-80" />
      <AnimatePresence custom={lastDecision} initial={false}>
        <SwipeCard key={cardKey} card={card} onDecision={onDecision} labels={labels} />
      </AnimatePresence>
      {lastDecision === "pick" && <HeartBurst key={cardKey} />}
    </div>
  );
}

/** Undo, pass, maybe and pick buttons below a swipe stack. */
export function SwipeButtons({
  onDecision,
  onUndo,
  canUndo,
  pickLabel = "Pick",
}: {
  onDecision: (decision: SwipeDecision) => void;
  onUndo: () => void;
  canUndo: boolean;
  pickLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <RoundButton label="Undo (Z)" onClick={onUndo} disabled={!canUndo} className="size-11">
        <ArrowUUpLeftIcon className="size-5" />
      </RoundButton>
      <RoundButton label="Pass (←)" onClick={() => onDecision("pass")} className="size-16 border-pass/70 text-pass hover:bg-pass/15">
        <XIcon className="size-8" />
      </RoundButton>
      <RoundButton label="Maybe (↑)" onClick={() => onDecision("maybe")} className="size-12 border-maybe/70 text-maybe hover:bg-maybe/15">
        <StarIcon className="size-5" />
      </RoundButton>
      <RoundButton label={`${pickLabel} (→)`} onClick={() => onDecision("pick")} className="size-16 border-pick/70 text-pick hover:bg-pick/15">
        <HeartIcon className="size-8" />
      </RoundButton>
    </div>
  );
}

/** ← pass, ↑ maybe, → pick, Z or Backspace undo — ignored while typing in a field or inside a dialog. */
export function useSwipeKeys(onDecision: (decision: SwipeDecision) => void, onUndo: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return;
      if (e.key === "ArrowRight") onDecision("pick");
      else if (e.key === "ArrowLeft") onDecision("pass");
      else if (e.key === "ArrowUp") onDecision("maybe");
      else if (e.key === "Backspace" || e.key.toLowerCase() === "z") onUndo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

/** A round, raised button with a tooltip, as under every swipe stack. */
export function RoundButton({
  label,
  className,
  children,
  ...props
}: { label: string } & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "grid place-items-center rounded-full border-2 border-input bg-card shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_3px_0_0_oklch(0_0_0/55%)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_1px_0_0_oklch(0_0_0/55%)] disabled:pointer-events-none disabled:opacity-40",
              className,
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
