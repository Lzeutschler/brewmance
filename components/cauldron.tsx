import { CardBack } from "@/components/card/card-back";
import { ManaSymbol } from "@/components/card/mana";
import { cn } from "@/lib/utils";

export type CauldronMood = "bubbling" | "empty" | "boiling";

const BUBBLES = [
  { cx: 92, r: 5, delay: "0s" },
  { cx: 128, r: 7, delay: "0.8s" },
  { cx: 168, r: 4.5, delay: "1.5s" },
  { cx: 110, r: 3.5, delay: "2.1s" },
  { cx: 150, r: 5.5, delay: "2.7s" },
];

/** Brew running over the front rim while it boils. */
const DRIPS = [
  { d: "M64 50c-4 14-3 26 2 30 5-4 4-16-2-30Z", delay: "0s" },
  { d: "M150 64c-3 12-2 22 2 25 4-3 3-13-2-25Z", delay: "0.9s" },
  { d: "M196 52c-3 10-2 19 2 22 4-3 3-12-2-22Z", delay: "1.7s" },
];

export const CAULDRON_HEART =
  "M16 10.2c-.3 0-4.8-2.9-4.8-6.1 0-1.6 1.2-2.8 2.7-2.8.9 0 1.7.5 2.1 1.3.4-.8 1.2-1.3 2.1-1.3 1.5 0 2.7 1.2 2.7 2.8 0 3.2-4.5 6.1-4.8 6.1Z";

/** A filled heart, the shape from the brand mark. Size it with width. */
export function HeartShape({
  className,
  fill = "var(--heart)",
  style,
}: {
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="10.8 1 10.4 9.6" className={className} style={style} aria-hidden="true">
      <path d={CAULDRON_HEART} fill={fill} />
    </svg>
  );
}

/**
 * The brand cauldron as an illustration, 26em × 18em. `children` render between its back and front,
 * so things placed there seem to rise out of the brew. Animations use the `brew-*` keyframes in
 * globals.css and stop under reduced motion (the `brew-scene` class).
 */
export function Cauldron({
  mood = "bubbling",
  still,
  className,
  children,
}: {
  mood?: CauldronMood;
  /** No bobbing, e.g. for a cauldron lying on its side. */
  still?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const bob = still ? undefined : "animate-[brew-bob_4s_ease-in-out_infinite]";
  const liquid = mood !== "empty";
  // A page can speed the bubbles up through --brew-bubble, e.g. while its main button is hovered.
  const bubbleSpeed = mood === "boiling" ? "1.3s" : "var(--brew-bubble, 2.6s)";
  return (
    <div className={cn("brew-scene relative h-[18em] w-[26em] select-none", className)} aria-hidden="true">
      {liquid && (
        <div className="absolute -inset-x-[2em] bottom-[2em] h-[20em] animate-[brew-glow_4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgb(142_162_255/32%),transparent)]" />
      )}

      {/* Back: the dark inside, the brew and the back of the rim. */}
      <svg viewBox="0 0 260 180" className={cn("absolute inset-0 size-full", bob)}>
        <ellipse cx="130" cy="42" rx="106" ry="23" fill="#0b0e13" />
        {liquid ? (
          <>
            <ellipse
              cx="130"
              cy="46"
              rx="96"
              ry="16"
              fill="#8ea2ff"
              className="origin-center animate-[brew-wobble_3.2s_ease-in-out_infinite] [transform-box:fill-box]"
            />
            <ellipse cx="112" cy="42" rx="44" ry="6" fill="#c9d3ff" opacity="0.55" />
            {BUBBLES.map((bubble) => (
              <circle
                key={bubble.cx}
                cx={bubble.cx}
                cy="48"
                r={bubble.r}
                fill="#dfe5ff"
                className="origin-center animate-[brew-bubble_2.6s_ease-out_infinite_both] opacity-0 [transform-box:fill-box] motion-reduce:opacity-60"
                style={{ animationDelay: bubble.delay, animationDuration: bubbleSpeed }}
              />
            ))}
          </>
        ) : (
          // An empty pot: just a little dust settling at the bottom.
          <ellipse cx="130" cy="52" rx="60" ry="6" fill="#1a1f28" />
        )}
        <path d="M24 42 A106 23 0 0 1 236 42" fill="none" stroke="#a6b6ff" strokeWidth="9" strokeLinecap="round" />
      </svg>

      {children}

      {/* Front: the pot, its legs and the front of the rim. */}
      <svg
        viewBox="0 0 260 180"
        className={cn("absolute inset-0 z-10 size-full drop-shadow-[0_1.2em_1.4em_rgb(0_0_0/55%)]", bob)}
      >
        <path d="M58 150 46 178h20l10-22Z" fill="#2e3878" />
        <path d="M202 150l12 28h-20l-10-22Z" fill="#2e3878" />
        <path d="M24 44 A106 23 0 0 0 236 44 C262 74 250 164 130 166 C10 164 -2 74 24 44Z" fill="#7f93f2" />
        <path d="M236 44 C262 74 250 164 130 166 C190 150 222 110 236 44Z" fill="#3b478f" opacity="0.55" />
        <ellipse cx="78" cy="96" rx="16" ry="30" fill="#ffffff" opacity="0.14" transform="rotate(-18 78 96)" />
        <path d={CAULDRON_HEART} transform="translate(34 70) scale(6)" fill="#0b0e13" opacity="0.18" />
        <path d="M24 42 A106 23 0 0 0 236 42" fill="none" stroke="#c3cdff" strokeWidth="10" strokeLinecap="round" />
        {mood === "boiling" &&
          DRIPS.map((drip) => (
            <path
              key={drip.d}
              d={drip.d}
              fill="#8ea2ff"
              className="origin-top animate-[brew-drip_2.4s_ease-in_infinite_both] [transform-box:fill-box]"
              style={{ animationDelay: drip.delay }}
            />
          ))}
      </svg>
    </div>
  );
}

/** A small bubbling cauldron with a line of text, for full-page loading states. */
export function BrewLoader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-4 text-muted-foreground", className)}>
      <Cauldron className="text-[4px]" />
      {children && <p className="text-sm">{children}</p>}
    </div>
  );
}

/** An empty cauldron with a message and optional actions, for "nothing here yet" states. */
export function EmptyCauldron({
  title,
  description,
  actions,
  flavor,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** A line of flavor text below everything else. */
  flavor?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel-inset flex flex-col items-center gap-4 border-dashed px-6 py-10 text-center", className)}>
      <Cauldron mood="empty" className="text-[4.5px]" />
      <div className="space-y-1.5">
        <h3 className="text-2xl font-medium">{title}</h3>
        {description && <p className="max-w-md text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
      {flavor && <div className="w-full max-w-md">{flavor}</div>}
    </div>
  );
}

const CELEBRATION_PIPS = [
  { symbol: "W", x: "-6em", drift: "-2em", delay: "0s" },
  { symbol: "U", x: "-2.5em", drift: "-1em", delay: "0.5s" },
  { symbol: "B", x: "1em", drift: "1.5em", delay: "1s" },
  { symbol: "R", x: "4.5em", drift: "2.5em", delay: "1.5s" },
  { symbol: "G", x: "-0.5em", drift: "-3em", delay: "2s" },
];

/**
 * A bubbling cauldron with mana symbols and hearts rising from it, for "your deck is ready". With
 * `colors` the steam is the deck's own color identity (the colorless symbol when it has none),
 * otherwise all five colors.
 */
export function CelebrationCauldron({ className, colors }: { className?: string; colors?: readonly string[] }) {
  const symbols = colors === undefined ? null : colors.length ? colors : ["C"];
  return (
    <div className={cn("brew-scene relative h-[28em] w-[30em]", className)} aria-hidden="true">
      <Cauldron className="absolute bottom-0 left-1/2 -translate-x-1/2" />
      {CELEBRATION_PIPS.map((pip, i) => (
        <span
          key={pip.x}
          className="absolute bottom-[13em] z-20 size-[3em] animate-[brew-float-sm_3.5s_ease-in-out_infinite_both] motion-reduce:hidden"
          style={{ left: `calc(50% - 1.5em + ${pip.x})`, animationDelay: pip.delay, "--drift": pip.drift } as React.CSSProperties}
        >
          <ManaSymbol symbol={symbols ? symbols[i % symbols.length] : pip.symbol} className="size-full drop-shadow-[0_0.3em_0.4em_rgb(0_0_0/45%)]" />
        </span>
      ))}
      {["-4em", "3em"].map((x, i) => (
        <HeartShape
          key={x}
          className="absolute bottom-[14em] z-20 w-[2em] animate-[brew-float-sm_3s_ease-in-out_infinite_both] motion-reduce:hidden"
          style={{ left: `calc(50% + ${x})`, animationDelay: `${0.8 + i * 1.3}s`, "--drift": i ? "1.5em" : "-1.5em" } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

const BURST = [
  { bx: "-7em", by: "-9em", size: "2.2em", delay: "0s" },
  { bx: "6em", by: "-11em", size: "2.6em", delay: "0.05s" },
  { bx: "-1em", by: "-14em", size: "3em", delay: "0.1s" },
  { bx: "9em", by: "-5em", size: "1.8em", delay: "0.12s" },
  { bx: "-9em", by: "-3em", size: "1.6em", delay: "0.16s" },
  { bx: "3em", by: "-7em", size: "1.4em", delay: "0.2s" },
];

/**
 * Hearts bursting out of the middle of the parent (which needs `relative`). Mount it with a new
 * `key` for every pick to replay it; hidden under reduced motion.
 */
export function HeartBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center text-[13px] motion-reduce:hidden" aria-hidden="true">
      {BURST.map((heart) => (
        <HeartShape
          key={heart.bx}
          className="absolute animate-[brew-burst_1.1s_ease-out_both] drop-shadow-[0_0.2em_0.3em_rgb(0_0_0/50%)]"
          style={{ width: heart.size, animationDelay: heart.delay, "--bx": heart.bx, "--by": heart.by } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/** A cauldron tipped over with its brew, a card and two pips spilled on the floor (404 page). */
export function SpilledCauldron({ className }: { className?: string }) {
  return (
    <div className={cn("brew-scene relative h-[30em] w-[52em]", className)} aria-hidden="true">
      <svg viewBox="0 0 520 300" className="absolute inset-0 size-full">
        <ellipse cx="320" cy="287" rx="175" ry="12" fill="#8ea2ff" opacity="0.4" />
        <ellipse cx="290" cy="285" rx="95" ry="5" fill="#c9d3ff" opacity="0.35" />
        {/* The brew pouring over the lower lip into the puddle. */}
        <path d="M160 268 C178 250 205 240 214 258 C222 274 250 282 280 286 L170 290 C160 286 154 276 160 268 Z" fill="#8ea2ff" opacity="0.8" />
      </svg>
      <Cauldron mood="empty" still className="absolute top-[8em] left-[2em] rotate-[112deg]" />
      <CardBack className="absolute right-[9em] bottom-[1.2em] z-20 w-[7.5em] rotate-[-16deg]" />
      <span className="absolute right-[20em] bottom-[0.4em] z-20 size-[3em] rotate-12">
        <ManaSymbol symbol="U" className="size-full" />
      </span>
      <span className="absolute right-[3em] bottom-[0.6em] z-20 size-[2.6em] -rotate-12">
        <ManaSymbol symbol="G" className="size-full" />
      </span>
    </div>
  );
}
