"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { CardBack } from "@/components/card/card-back";
import { CardImage } from "@/components/card/card-image";
import { cardImageUrl } from "@/lib/cards/image";
import type { GameCard } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

/** How long a finger has to rest on a card before its menu opens; touch screens have no right click. */
const LONG_PRESS_MS = 450;
/** Moving further than this means a drag (the drag sensor starts at 6px), not a hold. */
const LONG_PRESS_SLOP = 6;

export interface CardHandlers {
  onClick?: (card: GameCard) => void;
  onContextMenu?: (card: GameCard, position: { x: number; y: number }) => void;
  onHover?: (card: GameCard | null) => void;
}

/**
 * A card in the sandbox. Width comes from the surrounding `--card-w` CSS variable so each zone
 * can size its cards; tapped cards turn sideways. `enterFrom="library"` lets a new card fly in
 * from the library pile on the left, as when it is drawn into the hand.
 */
export function GameCardView({
  card,
  handlers,
  className,
  draggable = true,
  enterFrom,
}: {
  card: GameCard;
  handlers: CardHandlers;
  className?: string;
  draggable?: boolean;
  enterFrom?: "library";
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.instanceId,
    disabled: !draggable,
  });
  const counters = Object.entries(card.counters);

  // Holding a card on a touch screen opens its menu; the tap that ends the hold must not also play or tap it.
  const press = useRef<{ timer: number; x: number; y: number; opened: boolean } | null>(null);
  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
  };
  useEffect(() => {
    if (isDragging) cancelPress();
  }, [isDragging]);

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={enterFrom === "library" ? { opacity: 0, scale: 0.6, x: "-38vw", y: "-32vh", rotate: -14 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1, x: 0, y: 0, rotate: card.tapped ? 90 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "relative shrink-0 cursor-pointer touch-none select-none [-webkit-touch-callout:none]",
        card.tapped && "mx-[calc(var(--card-w)*0.2)]",
        className,
      )}
      style={{ width: "var(--card-w)" }}
      onContextMenu={(e) => {
        e.preventDefault();
        handlers.onContextMenu?.(card, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={() => handlers.onHover?.(card)}
      onMouseLeave={() => handlers.onHover?.(null)}
      data-card-name={card.faceDown ? undefined : card.card.name}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        if (e.pointerType === "mouse" || !handlers.onContextMenu) return;
        const { clientX: x, clientY: y } = e;
        const timer = window.setTimeout(() => {
          if (press.current) press.current.opened = true;
          handlers.onContextMenu?.(card, { x, y });
        }, LONG_PRESS_MS);
        press.current = { timer, x, y, opened: false };
      }}
      onPointerMove={(e) => {
        if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > LONG_PRESS_SLOP) cancelPress();
      }}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onClick={() => {
        if (press.current?.opened) {
          press.current = null;
          return;
        }
        handlers.onClick?.(card);
      }}
    >
      <CardFace card={card} />
      {(counters.length > 0 || card.isToken) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex flex-wrap justify-center gap-1">
          {counters.map(([kind, amount]) => (
            <span key={kind} className="rounded-sm bg-ink/90 px-1.5 py-0.5 text-xs font-semibold text-brand tabular-nums shadow-xs ring-1 ring-brand/60">
              {kind === "+1/+1" ? `+${amount}/+${amount}` : `${amount} ${kind}`}
            </span>
          ))}
          {card.isToken && <span className="ui-label rounded-sm bg-ink/85 px-1.5 py-0.5 text-[10px] text-muted-foreground">token</span>}
        </div>
      )}
    </motion.div>
  );
}

export function CardFace({ card }: { card: GameCard }) {
  if (card.faceDown) return <CardBack />;
  if (card.flipped && card.card.image?.doubleFaced) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
      <img
        src={cardImageUrl(card.card.image, "normal", "back")}
        alt={card.card.name}
        draggable={false}
        className="card-aspect w-full rounded-[4.75%] object-cover shadow-lg"
      />
    );
  }
  return <CardImage card={card.card} />;
}
