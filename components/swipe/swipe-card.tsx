"use client";

import { motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from "motion/react";

import { CardImage } from "@/components/card/card-image";
import type { CardDisplay } from "@/lib/cards/types";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { cn } from "@/lib/utils";

export const SWIPE_DISTANCE = 110;
export const SWIPE_VELOCITY = 600;

const exitVariants = {
  enter: { opacity: 0, scale: 0.9, y: 24 },
  center: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
  exit: (decision: SwipeDecision | null) => ({
    opacity: 0,
    x: decision === "pick" ? 520 : decision === "pass" ? -520 : 0,
    y: decision === "maybe" ? -560 : 40,
    rotate: decision === "pick" ? 22 : decision === "pass" ? -22 : 0,
    transition: { duration: 0.32, ease: "easeIn" as const },
  }),
};

/** What the stamps on a dragged card say; the upgrade swipe swaps instead of picking. */
export type SwipeLabels = Partial<Record<SwipeDecision, string>>;

/** A draggable card for any swipe stack: deck candidates as well as quiz commanders. */
export function SwipeCard({
  card,
  onDecision,
  labels,
}: {
  card: CardDisplay;
  onDecision: (decision: SwipeDecision) => void;
  labels?: SwipeLabels;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const pickOpacity = useTransform(x, [30, SWIPE_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -30], [1, 0]);
  const maybeOpacity = useTransform(y, [-SWIPE_DISTANCE, -30], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.y < -SWIPE_DISTANCE && Math.abs(offset.y) > Math.abs(offset.x)) onDecision("maybe");
    else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) onDecision("pick");
    else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) onDecision("pass");
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, y, rotate }}
      drag
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      variants={exitVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileDrag={{ scale: 1.03 }}
    >
      <CardImage card={card} size="large" eager flippable className="size-full shadow-2xl shadow-black/60" />
      <Stamp label={labels?.pick ?? "PICK"} className="top-8 left-6 -rotate-12 border-pick text-pick" opacity={pickOpacity} />
      <Stamp label={labels?.pass ?? "PASS"} className="top-8 right-6 rotate-12 border-pass text-pass" opacity={passOpacity} />
      <Stamp label={labels?.maybe ?? "MAYBE"} className="bottom-16 left-1/2 -translate-x-1/2 border-maybe text-maybe" opacity={maybeOpacity} />
    </motion.div>
  );
}

/** PICK, PASS or MAYBE on a card, fading in with the drag. */
export function Stamp({
  label,
  className,
  opacity,
}: {
  label: string;
  className: string;
  opacity: MotionValue<number>;
}) {
  return (
    <motion.span
      style={{ opacity }}
      className={cn("pointer-events-none absolute rounded-lg border-4 bg-black/50 px-3 py-1 font-heading text-3xl font-bold tracking-widest", className)}
    >
      {label}
    </motion.span>
  );
}
