"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";

import { ManaSymbol } from "@/components/card/mana";
import { CheckIcon } from "@/components/icons";
import { Stamp, SWIPE_DISTANCE, SWIPE_VELOCITY } from "@/components/swipe/swipe-card";
import { artCropUrl } from "@/lib/cards/image";
import type { QuizCard } from "@/lib/quiz/deck";
import type { AnswerOption, Question } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

export type SwipeDirection = "left" | "right" | "up";

const exitVariants = {
  enter: { opacity: 0, scale: 0.92, y: 24 },
  center: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
  exit: (direction: SwipeDirection | null) => ({
    opacity: 0,
    x: direction === "right" ? 520 : direction === "left" ? -520 : 0,
    y: direction === "up" ? -560 : 40,
    rotate: direction === "right" ? 22 : direction === "left" ? -22 : 0,
    transition: { duration: 0.32, ease: "easeIn" as const },
  }),
};

/**
 * The top card of the quiz deck. Yes/no, gate and versus cards are dragged left, right or (with a
 * middle answer) up; pick cards stay put while their tiles are tapped.
 */
export function QuizSwipeCard({
  card,
  picked,
  onToggle,
  onSwipe,
  testId = "quiz-card",
}: {
  card: QuizCard;
  /** Picked option ids per question id, for pick cards. */
  picked: Record<string, string[]>;
  onToggle: (question: Pick<Question, "id" | "max" | "options">, optionId: string) => void;
  onSwipe: (direction: SwipeDirection) => void;
  /** The card's test id; null leaves it out (other quizzes on the site). */
  testId?: string | null;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const draggable = card.kind !== "pick";
  const canGoUp = card.kind === "versus" && Boolean(card.middle);

  const onDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    if (canGoUp && offset.y < -SWIPE_DISTANCE && Math.abs(offset.y) > Math.abs(offset.x)) onSwipe("up");
    else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) onSwipe("right");
    else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) onSwipe("left");
  };

  return (
    <motion.div
      className={cn("absolute inset-0", draggable && "cursor-grab touch-none active:cursor-grabbing")}
      style={{ x, y, rotate }}
      drag={draggable}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      variants={exitVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileDrag={{ scale: 1.03 }}
      data-testid={testId ?? undefined}
      data-card={card.id}
    >
      {card.kind === "yesno" && (
        <YesNoFace
          kicker={card.question.title}
          title={card.option.label}
          description={card.option.description}
          art={card.option.art}
          symbol={card.option.symbol}
          x={x}
        />
      )}
      {card.kind === "gate" && <YesNoFace title={card.title} description={card.description} art={card.art} x={x} />}
      {card.kind === "versus" && <VersusFace card={card} x={x} y={y} />}
      {card.kind === "pick" && <PickFace question={card.question} picked={picked} onToggle={onToggle} />}
    </motion.div>
  );
}

/** A black-bordered card like a printed Magic card; `@container` lets the text scale with the card. */
function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="@container size-full rounded-[4.75%] bg-ink p-[3.2%] shadow-2xl ring-1 shadow-black/60 ring-black/60">
      <div className={cn("relative isolate size-full overflow-hidden rounded-[3%] bg-card", className)}>{children}</div>
    </div>
  );
}

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "ui-label absolute top-[4%] left-[5%] z-10 max-w-[90%] rounded-md bg-ink/80 px-2.5 py-1 text-foreground/90 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** One answer as a profile: big art, a name and a line about it. YES and NOPE stamp in with the drag. */
function YesNoFace({
  kicker,
  title,
  description,
  art,
  symbol,
  x,
}: {
  kicker?: string;
  title: string;
  description?: string;
  art?: string;
  symbol?: string;
  x: MotionValue<number>;
}) {
  const yes = useTransform(x, [30, SWIPE_DISTANCE], [0, 1]);
  const no = useTransform(x, [-SWIPE_DISTANCE, -30], [1, 0]);
  return (
    <CardShell>
      {art && (
        // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
        <img src={artCropUrl(art)} alt="" draggable={false} className="absolute inset-x-0 top-0 -z-10 h-[76%] w-full object-cover" />
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--card)_24%,oklch(0.2_0.015_260/0.7)_42%,transparent_64%)]" />
      {kicker && <Kicker>{kicker}</Kicker>}
      <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-[7%]">
        {symbol && <ManaSymbol symbol={symbol} className="size-8 drop-shadow-lg" />}
        <h2 className="text-[1.65rem] leading-[1.05] font-semibold @[21rem]:text-[2.1rem]">{title}</h2>
        {description && <p className="text-sm leading-snug text-foreground/75 @[21rem]:text-base">{description}</p>}
      </div>
      <Stamp label="YES" className="top-[16%] left-[7%] -rotate-12 border-pick text-pick" opacity={yes} />
      <Stamp label="NOPE" className="top-[16%] right-[7%] rotate-12 border-pass text-pass" opacity={no} />
    </CardShell>
  );
}

/** Where the diagonal seam of a versus card meets the top and bottom edge, in % from the left. */
const SEAM_TOP = 62;
const SEAM_BOTTOM = 38;

/**
 * Two answers split by a diagonal: the left one owns the top-left, the right one the bottom-right.
 * Dragging toward a side pushes the seam over and dims the other side.
 */
function VersusFace({
  card,
  x,
  y,
}: {
  card: Extract<QuizCard, { kind: "versus" }>;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  const shift = useTransform(x, [-160, 0, 160], [24, 0, -24]);
  const top = useTransform(shift, (s) => SEAM_TOP + s);
  const bottom = useTransform(shift, (s) => SEAM_BOTTOM + s);
  const middle = useTransform(shift, (s) => (SEAM_TOP + SEAM_BOTTOM) / 2 + s);
  const leftClip = useMotionTemplate`polygon(0 0, ${top}% 0, ${bottom}% 100%, 0 100%)`;
  const rightClip = useMotionTemplate`polygon(${top}% 0, 100% 0, 100% 100%, ${bottom}% 100%)`;
  const badgeLeft = useMotionTemplate`${middle}%`;
  const leftDim = useTransform(x, [0, 140], [0, 0.6]);
  const rightDim = useTransform(x, [-140, 0], [0.6, 0]);
  const upOpacity = useTransform(y, [-SWIPE_DISTANCE, -30], [1, 0]);

  return (
    <CardShell className="bg-ink">
      <motion.div className="absolute inset-0" style={{ clipPath: leftClip }}>
        <VersusArt option={card.left} position="75% 50%" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,oklch(0.14_0.01_260/0.92)_8%,oklch(0.14_0.01_260/0.35)_42%,transparent_60%)]" />
        <motion.div className="absolute inset-0 bg-ink" style={{ opacity: leftDim }} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ clipPath: rightClip }}>
        <VersusArt option={card.right} position="25% 50%" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.14_0.01_260/0.92)_8%,oklch(0.14_0.01_260/0.35)_42%,transparent_60%)]" />
        <motion.div className="absolute inset-0 bg-ink" style={{ opacity: rightDim }} />
      </motion.div>

      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <motion.line x1={top} y1={0} x2={bottom} y2={100} stroke="var(--ink)" strokeWidth={7} vectorEffect="non-scaling-stroke" />
        <motion.line x1={top} y1={0} x2={bottom} y2={100} stroke="var(--brand)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <motion.span
        className="absolute top-1/2 grid size-12 -translate-1/2 place-items-center rounded-full border-2 border-brand bg-ink font-heading text-xl font-semibold text-brand italic shadow-lg"
        style={{ left: badgeLeft }}
        aria-hidden="true"
      >
        vs
      </motion.span>

      <Kicker className="left-1/2 w-max -translate-x-1/2 text-center">{card.question.title}</Kicker>
      <VersusLabel option={card.left} arrow="←" className="top-[15%] left-[6%] text-left" />
      <VersusLabel option={card.right} arrow="→" className="right-[6%] bottom-[6%] text-right" />
      {card.middle && (
        <Stamp
          label={card.middle.label}
          className="top-[40%] left-1/2 max-w-[80%] -translate-x-1/2 border-maybe text-center text-xl leading-tight tracking-normal text-maybe"
          opacity={upOpacity}
        />
      )}
    </CardShell>
  );
}

/**
 * An art crop covering the whole card. It is about twice as wide as the card, so pushing it toward
 * the opposite edge (`position`) centers its subject in the half that shows it.
 */
function VersusArt({ option, position }: { option: AnswerOption; position: string }) {
  if (!option.art) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
    <img src={artCropUrl(option.art)} alt="" draggable={false} className="absolute inset-0 size-full object-cover" style={{ objectPosition: position }} />
  );
}

function VersusLabel({ option, arrow, className }: { option: AnswerOption; arrow: string; className: string }) {
  return (
    <div className={cn("absolute max-w-[46%] space-y-1 drop-shadow-[0_1px_2px_oklch(0_0_0/90%)]", className)}>
      <span className="ui-label text-brand" aria-hidden="true">
        {arrow}
      </span>
      <h2 className="text-[1.35rem] leading-[1.05] font-semibold @[21rem]:text-[1.7rem]">{option.label}</h2>
      {option.description && <p className="text-xs leading-snug text-foreground/80 @[21rem]:text-sm">{option.description}</p>}
    </div>
  );
}

/** A long list as tiles on one card: tap up to `max`; the oldest pick makes room at the limit. */
function PickFace({
  question,
  picked,
  onToggle,
}: {
  question: Question;
  picked: Record<string, string[]>;
  onToggle: (question: Pick<Question, "id" | "max" | "options">, optionId: string) => void;
}) {
  const options = question.options.filter((o) => !o.exclusive);
  const symbols = options.every((o) => o.symbol);
  const columns = symbols ? 3 : options.length <= 8 ? 2 : options.length <= 12 ? 3 : 4;
  const selected = picked[question.id] ?? [];
  const followUp = question.followUp;

  return (
    <CardShell className="flex flex-col gap-[2.5%] p-[5%]">
      <header className="space-y-0.5 text-center">
        <h2 className="text-xl leading-tight font-semibold @[21rem]:text-2xl">{question.title}</h2>
        {question.subtitle && <p className="text-xs text-muted-foreground @[21rem]:text-sm">{question.subtitle}</p>}
      </header>
      <div
        role="group"
        aria-label={question.title}
        className="grid min-h-0 flex-1 gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${Math.ceil(options.length / columns)}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => (
          <PickTile key={option.id} option={option} selected={selected.includes(option.id)} onClick={() => onToggle(question, option.id)} />
        ))}
      </div>
      {followUp && (
        <div role="radiogroup" aria-label={followUp.title} className="flex items-center justify-center gap-1.5">
          {followUp.options.map((option) => {
            const active = picked[followUp.id]?.includes(option.id) ?? false;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onToggle(followUp, option.id)}
                className={cn(
                  "min-h-9 flex-1 rounded-md border border-border bg-ink px-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground @[21rem]:text-sm",
                  active && "border-brand bg-brand/15 text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

function PickTile({ option, selected, onClick }: { option: AnswerOption; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative isolate overflow-hidden rounded-md border-2 border-transparent bg-ink text-left shadow-md transition active:scale-[0.97]",
        selected && "border-brand",
      )}
    >
      {option.art && (
        // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized art crops
        <img
          src={artCropUrl(option.art)}
          alt=""
          loading="lazy"
          draggable={false}
          className={cn("absolute inset-0 -z-10 size-full object-cover transition duration-300 group-hover:scale-105", selected && "scale-105")}
        />
      )}
      <div className={cn("absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/25 to-transparent transition", selected && "bg-brand/25")} />
      {option.symbol && (
        <ManaSymbol symbol={option.symbol} className="absolute top-1/2 left-1/2 size-[40%] max-h-12 max-w-12 -translate-1/2 drop-shadow-[0_2px_4px_oklch(0_0_0/70%)]" />
      )}
      <span className="absolute inset-x-0 bottom-0 p-1.5 text-[0.7rem] leading-tight font-semibold drop-shadow-[0_1px_1px_oklch(0_0_0/90%)] @[21rem]:text-xs">
        {option.label}
      </span>
      {selected && (
        <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-sm bg-brand text-ink shadow-md">
          <CheckIcon className="size-3" />
        </span>
      )}
    </button>
  );
}
