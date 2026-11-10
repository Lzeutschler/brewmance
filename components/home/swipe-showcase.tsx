import { CardBack } from "@/components/card/card-back";
import { ManaSymbol } from "@/components/card/mana";
import { HeartShape as Heart } from "@/components/cauldron";
import { HeartIcon, XIcon } from "@/components/icons";
import { cardImageUrl } from "@/lib/cards/image";
import { SHOWCASE_COMMANDERS as COMMANDERS } from "@/lib/cards/showcase";
import { cn } from "@/lib/utils";

/** Which way each showcase commander gets swiped, in turn: a pick, a pass, a pick. */
const DIRECTIONS = ["right", "left", "right"] as const;

/** Hearts bursting from a pick; offsets in em. */
const BURST = [
  { bx: "3.5em", by: "-6em", size: "1.5em", delay: "0s" },
  { bx: "6em", by: "-3em", size: "1.1em", delay: "0.1s" },
  { bx: "1em", by: "-8em", size: "1.2em", delay: "0.2s" },
];

/** Mana pips hovering around the stack. */
const PIPS = [
  { symbol: "W", className: "top-[8%] left-[6%]", delay: "0s" },
  { symbol: "U", className: "top-[44%] left-[1%]", delay: "1.2s" },
  { symbol: "B", className: "top-[2%] right-[10%]", delay: "0.6s" },
  { symbol: "R", className: "top-[40%] right-[2%]", delay: "1.8s" },
  { symbol: "G", className: "bottom-[24%] left-[12%]", delay: "2.4s" },
];

/**
 * The phone hero: a swipe stack where the showcase commanders get swiped by themselves, PICK with a
 * burst of hearts or PASS, while the buttons below press along. Pure CSS animation on a 12s loop
 * (keyframes `brew-swipe-*` and `brew-press-*` in globals.css); with reduced motion the first
 * commander rests on top. Sized in em, so it scales with its font size.
 */
export function SwipeShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("brew-scene relative flex w-full flex-col items-center gap-[1.2em] select-none", className)} aria-hidden="true">
      <div className="absolute top-[42%] left-1/2 size-[24em] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(142_162_255/22%),transparent)]" />
      {PIPS.map((pip) => (
        <span
          key={pip.symbol}
          className={cn("absolute size-[2.2em] animate-[brew-bob_3.5s_ease-in-out_infinite] drop-shadow-[0_0.3em_0.4em_rgb(0_0_0/45%)]", pip.className)}
          style={{ animationDelay: pip.delay }}
        >
          <ManaSymbol symbol={pip.symbol} className="size-full" />
        </span>
      ))}

      <div className="card-aspect relative w-[11em]">
        <CardBack className="absolute inset-0 translate-x-[0.8em] translate-y-[0.7em] rotate-[5deg] opacity-50" />
        <CardBack className="absolute inset-0 translate-x-[0.4em] translate-y-[0.35em] rotate-[2.5deg] opacity-80" />
        {COMMANDERS.map((commander, i) => {
          const right = DIRECTIONS[i % DIRECTIONS.length] === "right";
          const delay = `${i * 4}s`;
          return (
            <div key={commander.name} className="absolute inset-0">
              <div
                className={cn(
                  "absolute inset-0",
                  right
                    ? "animate-[brew-swipe-right_12s_ease-in-out_infinite_both]"
                    : "animate-[brew-swipe-left_12s_ease-in-out_infinite_both]",
                  i > 0 && "motion-reduce:hidden",
                )}
                style={{ animationDelay: delay }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
                <img
                  src={cardImageUrl(commander.image, "normal")}
                  alt=""
                  draggable={false}
                  className="card-aspect w-full rounded-[4.75%] shadow-2xl ring-1 shadow-black/60 ring-black/60"
                />
                <span
                  className={cn(
                    "absolute top-[14%] animate-[brew-swipe-stamp_12s_ease-out_infinite_both] rounded-[0.4em] border-[0.2em] bg-black/50 px-[0.4em] py-[0.05em] font-heading text-[1.6em] font-semibold tracking-widest motion-reduce:hidden",
                    right ? "left-[8%] -rotate-12 border-pick text-pick" : "right-[8%] rotate-12 border-pass text-pass",
                  )}
                  style={{ animationDelay: delay }}
                >
                  {right ? "PICK" : "PASS"}
                </span>
              </div>
              {right &&
                BURST.map((heart) => (
                  <Heart
                    key={heart.bx}
                    className="absolute top-[30%] left-[55%] animate-[brew-swipe-heart_12s_ease-out_infinite_both] drop-shadow-[0_0.2em_0.3em_rgb(0_0_0/50%)] motion-reduce:hidden"
                    style={
                      {
                        width: heart.size,
                        animationDelay: `calc(${delay} + ${heart.delay})`,
                        "--bx": heart.bx,
                        "--by": heart.by,
                      } as React.CSSProperties
                    }
                  />
                ))}
            </div>
          );
        })}
      </div>

      <div className="relative flex items-center gap-[1.6em]">
        <span className="grid size-[3.6em] animate-[brew-press-pass_12s_ease-in-out_infinite] place-items-center rounded-full border-2 border-pass/70 bg-card text-pass shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_3px_0_0_oklch(0_0_0/55%)]">
          <XIcon className="size-[1.7em]" />
        </span>
        <span className="grid size-[3.6em] animate-[brew-press-pick_12s_ease-in-out_infinite] place-items-center rounded-full border-2 border-pick/70 bg-card text-pick shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_3px_0_0_oklch(0_0_0/55%)]">
          <HeartIcon className="size-[1.7em]" />
        </span>
      </div>
    </div>
  );
}
