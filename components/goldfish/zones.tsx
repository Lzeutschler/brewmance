"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { CardBack } from "@/components/card/card-back";
import { ManaGlyph } from "@/components/icons";
import { isLand } from "@/lib/cards/mana";
import type { GameCard, GameState, ZoneId } from "@/lib/goldfish/types";
import { ZONE_LABELS } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

import { GameCardView, type CardHandlers } from "./game-card";

function useZoneDrop(zone: ZoneId) {
  return useDroppable({ id: zone });
}

const FRONT_ROW = /\b(Creature|Planeswalker|Battle)\b/;

/** Identical, untouched permanents share a stack, like lands in Arena. Cards with counters stand alone. */
function stackKey(card: GameCard): string {
  if (Object.keys(card.counters).length > 0) return card.instanceId;
  return [card.card.name, card.tapped, card.faceDown, card.flipped, card.isToken].join("|");
}

function toStacks(cards: GameCard[]): GameCard[][] {
  const stacks = new Map<string, GameCard[]>();
  for (const card of cards) {
    const key = stackKey(card);
    stacks.set(key, [...(stacks.get(key) ?? []), card]);
  }
  return [...stacks.values()];
}

const SCALES = [1, 0.9, 0.8, 0.7, 0.6];
const GAP = 8;

/** Rows a lane needs when its stacks wrap at `width`; tapped cards are turned sideways and take more room. */
function rowCount(stacks: GameCard[][], card: number, width: number): number {
  let rows = 1;
  let x = 0;
  for (const stack of stacks) {
    const w = card * (stack[0].tapped ? 1.4 : 1);
    if (x > 0 && x + GAP + w > width) {
      rows++;
      x = w;
    } else x += (x > 0 ? GAP : 0) + w;
  }
  return rows;
}

function fanHeight(stacks: GameCard[][]): number {
  const deepest = Math.max(1, ...stacks.map((s) => s.length));
  return deepest > 1 ? Math.min(0.14 * (deepest - 1), 0.5) : 0;
}

/**
 * Like Arena, cards shrink as the board fills up: the largest scale at which both rows fit
 * without scrolling. `--bf-base` is the full card width the table allows.
 */
function useBoardScale(front: GameCard[][], back: GameCard[][]) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number; card: number } | null>(null);

  useLayoutEffect(() => {
    const element = boxRef.current;
    const probe = probeRef.current;
    if (!element || !probe) return;
    const measure = () =>
      setBox({ width: element.clientWidth - 24, height: element.clientHeight - 24, card: probe.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  let scale = SCALES.at(-1)!;
  if (!box?.card) scale = 1;
  else {
    for (const candidate of SCALES) {
      const card = box.card * candidate;
      const rows = rowCount(front, card, box.width) + rowCount(back, card, box.width);
      const fans = (fanHeight(front) + fanHeight(back)) * card;
      // Card rows, the gaps between them, and the divider between front and back row.
      if (rows * card * 1.395 + rows * GAP + 9 + fans <= box.height) {
        scale = candidate;
        break;
      }
    }
  }
  return { boxRef, probeRef, scale };
}

/**
 * The battlefield: creatures, planeswalkers and battles in the front row; lands and other
 * permanents in the back row next to the hand.
 */
export function Battlefield({ game, handlers }: { game: GameState; handlers: CardHandlers }) {
  const { setNodeRef, isOver } = useZoneDrop("battlefield");
  const cards = game.zones.battlefield.map((id) => game.cards[id]);
  const front = cards.filter((c) => !c.faceDown && FRONT_ROW.test(c.card.typeLine.split(" // ")[0]));
  const lands = cards.filter((c) => !c.faceDown && !front.includes(c) && isLand(c.card));
  const others = cards.filter((c) => !front.includes(c) && !lands.includes(c));
  const frontStacks = toStacks(front);
  const landStacks = toStacks(lands);
  const otherStacks = toStacks(others);
  const { boxRef, probeRef, scale } = useBoardScale(frontStacks, [...landStacks, ...otherStacks]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        boxRef.current = node;
      }}
      data-zone="battlefield"
      className={cn(
        "playmat relative flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-auto rounded-xl border border-black/50 p-3 shadow-[inset_0_2px_12px_oklch(0_0_0/45%)] transition-shadow",
        isOver && "shadow-[inset_0_0_0_2px_var(--brand),inset_0_2px_12px_oklch(0_0_0/45%)]",
      )}
      style={{ "--card-w": `calc(var(--bf-base) * ${scale})` } as React.CSSProperties}
    >
      <div ref={probeRef} aria-hidden="true" className="pointer-events-none invisible absolute h-0 w-[var(--bf-base)]" />
      {cards.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-foreground/60">
          <span className="pointer-coarse:hidden">Drag cards here or click a card in your hand to play it</span>
          <span className="hidden px-6 text-center pointer-coarse:inline">
            Tap a card in your hand to play it, or hold it for more options
          </span>
        </div>
      )}
      <Lane label="Creatures" glyph="creature" stacks={frontStacks} handlers={handlers} className="flex-auto shrink-0" />
      <div className="flex shrink-0 items-start gap-6 border-t border-dashed border-white/12 pt-2">
        <Lane label="Lands" glyph="land" stacks={landStacks} handlers={handlers} className="min-w-0 flex-1" />
        {others.length > 0 && (
          <Lane label="Other permanents" glyph="artifact" stacks={otherStacks} handlers={handlers} className="min-w-0 max-w-[50%] justify-end" />
        )}
      </div>
    </div>
  );
}

function Lane({
  label,
  glyph,
  stacks,
  handlers,
  className,
}: {
  label: string;
  glyph: "creature" | "land" | "artifact";
  stacks: GameCard[][];
  handlers: CardHandlers;
  className?: string;
}) {
  return (
    <section aria-label={label} className={cn("relative flex min-h-[calc(var(--card-w)*1.395)] flex-wrap content-start items-start gap-2", className)}>
      {stacks.length === 0 && (
        <span className="ui-label pointer-events-none flex items-center gap-1.5 self-center text-foreground/55">
          <ManaGlyph name={glyph} className="text-base" /> {label}
        </span>
      )}
      <AnimatePresence initial={false}>
        {stacks.map((stack) =>
          stack.length === 1 ? (
            <GameCardView key={stack[0].instanceId} card={stack[0]} handlers={handlers} />
          ) : (
            <Stack key={stack[0].instanceId} cards={stack} handlers={handlers} />
          ),
        )}
      </AnimatePresence>
    </section>
  );
}

/** Copies of one card fanned downwards; every card stays clickable and draggable on its visible strip. */
function Stack({ cards, handlers }: { cards: GameCard[]; handlers: CardHandlers }) {
  const tapped = cards[0].tapped;
  // The fan never grows taller than half a card, however many copies there are.
  const step = `calc(var(--card-w) * ${Math.min(0.14, 0.5 / (cards.length - 1)).toFixed(3)})`;
  return (
    <div
      className="relative shrink-0"
      style={{
        width: tapped ? "calc(var(--card-w) * 1.4)" : "var(--card-w)",
        height: `calc(var(--card-w) * 1.395 + ${step} * ${cards.length - 1})`,
      }}
    >
      {cards.map((card, i) => (
        <div
          key={card.instanceId}
          className="absolute"
          style={{ top: `calc(${step} * ${i})`, left: tapped ? "calc(var(--card-w) * 0.2)" : 0, zIndex: i }}
        >
          <GameCardView card={card} handlers={handlers} className="mx-0" />
        </div>
      ))}
      <span className="pointer-events-none absolute -top-2 -right-2 z-20 grid h-6 min-w-6 place-items-center rounded-sm bg-ink px-1 text-xs font-semibold tabular-nums shadow-md ring-1 ring-white/15">
        ×{cards.length}
      </span>
    </div>
  );
}

/** The hand peeks in from the bottom edge like in Arena; a hovered card rises to full size. */
export function Hand({ game, handlers }: { game: GameState; handlers: CardHandlers }) {
  const { setNodeRef, isOver } = useZoneDrop("hand");
  const cards = game.zones.hand.map((id) => game.cards[id]);
  const mid = (cards.length - 1) / 2;
  const overlap = cards.length > 10 ? 0.55 : cards.length > 7 ? 0.38 : 0.12;

  return (
    <div
      ref={setNodeRef}
      data-zone="hand"
      // With a mouse the hand peeks up and a hovered card rises; touch screens cannot hover, so they show whole cards.
      className={cn(
        "relative z-20 flex h-[calc(var(--hand-w)*1.08)] shrink-0 items-start justify-center px-4 pt-2 transition-colors pointer-coarse:h-[calc(var(--hand-w)*1.393+1.75rem)]",
        isOver && "bg-brand/8",
      )}
    >
      {cards.length === 0 && <span className="self-center text-sm text-muted-foreground">Hand is empty</span>}
      {cards.map((card, i) => (
        <div
          key={card.instanceId}
          className="group/hand relative z-(--z) transition-transform duration-150 ease-out [--card-w:var(--hand-w)] hover:z-50"
          style={{
            // Overlap more when the cards would not fit the width otherwise, e.g. seven cards on a phone.
            marginLeft:
              i === 0 ? 0 : `min(calc(var(--hand-w) * -${overlap}), calc((100% - var(--hand-w)) / ${cards.length - 1} - var(--hand-w)))`,
            transform: `rotate(${(i - mid) * 1.6}deg) translateY(${Math.abs(i - mid) ** 1.5 * 1.5}px)`,
            "--z": i,
          } as React.CSSProperties}
        >
          <div className="transition-transform duration-150 ease-out origin-bottom group-hover/hand:-translate-y-[30%] group-hover/hand:scale-[1.2]">
            <GameCardView card={card} handlers={handlers} enterFrom="library" />
          </div>
        </div>
      ))}
      <span className="ui-label pointer-events-none absolute top-1.5 right-4 text-muted-foreground">
        Hand <span className="text-foreground tabular-nums">{cards.length}</span>
      </span>
    </div>
  );
}

/** A stacked zone (library, graveyard, exile, command) that shows its top card and a count. */
export function Pile({
  zone,
  game,
  onClick,
  handlers,
  faceDown,
  badgeFor,
  children,
}: {
  zone: ZoneId;
  game: GameState;
  onClick?: () => void;
  handlers: CardHandlers;
  faceDown?: boolean;
  /** A small label on a card, e.g. the commander tax. */
  badgeFor?: (instanceId: string) => string | undefined;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useZoneDrop(zone);
  const ids = game.zones[zone];
  const topId = zone === "library" ? ids[0] : ids.at(-1);
  const top = topId ? game.cards[topId] : null;
  // Both commanders of a pair stay in view, one below the other.
  const spread = zone === "command" && ids.length > 1;
  const badge = top && !spread ? badgeFor?.(top.instanceId) : undefined;

  return (
    <div className="space-y-1">
      <div className="ui-label flex items-center justify-between gap-1 text-xs text-muted-foreground">
        <span className="truncate">{zone === "command" ? "Command" : ZONE_LABELS[zone]}</span>
        <span className="text-foreground tabular-nums">{ids.length}</span>
      </div>
      <div
        ref={setNodeRef}
        data-zone={zone}
        className={cn(
          "relative rounded-[6%] transition",
          isOver && "ring-2 ring-brand ring-offset-2 ring-offset-background",
        )}
      >
        {spread ? (
          <div className="flex flex-col gap-2">
            {ids.map((id) => (
              <div key={id} className="relative">
                <GameCardView card={game.cards[id]} handlers={handlers} />
                <PileBadge>{badgeFor?.(id)}</PileBadge>
              </div>
            ))}
          </div>
        ) : top && !faceDown ? (
          <GameCardView card={top} handlers={{ ...handlers, onClick: onClick ? () => onClick() : handlers.onClick }} />
        ) : (
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="block w-[var(--card-w)] rounded-[4.75%] disabled:cursor-default"
            aria-label={ZONE_LABELS[zone]}
            onMouseEnter={() => handlers.onHover?.(null)}
          >
            {top ? (
              <div className="relative">
                {ids.length > 1 && <CardBack className="absolute inset-0 translate-x-[3px] translate-y-[3px] opacity-70" />}
                <CardBack className="relative" />
              </div>
            ) : (
              <div className="panel-inset card-aspect grid place-items-center rounded-[4.75%] border-dashed text-[11px] text-muted-foreground">
                empty
              </div>
            )}
          </button>
        )}
        <PileBadge>{badge}</PileBadge>
      </div>
      {children}
    </div>
  );
}

function PileBadge({ children }: { children: string | undefined }) {
  if (!children) return null;
  return (
    <span className="pointer-events-none absolute -top-2 -right-2 rounded-sm bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-md">
      {children}
    </span>
  );
}
