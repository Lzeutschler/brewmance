import Link from "next/link";

import { CardBack } from "@/components/card/card-back";
import { HeartShape } from "@/components/cauldron";
import { ArrowRightIcon, SwapIcon } from "@/components/icons";
import { artCropUrl, cardImageUrl, imageUrlForKey } from "@/lib/cards/image";
import { SHOWCASE_COMMANDERS } from "@/lib/cards/showcase";
import { cn } from "@/lib/utils";

/** Scryfall image keys of the cards the little scenes are made of. */
const CARDS = {
  shivanDragon: "7/0/702c4781-670b-49ae-b511-90ed119841b0",
  llanowarElves: "6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd",
  grizzlyBears: "4/0/409f9b88-f03e-40b6-9883-68c14c37c0de",
  forest: "2/e/2e781bfd-f8cb-4d20-b977-4359f3a21311",
  kodamasReach: "9/0/90c423cc-1264-4067-9c50-e7c88c68ef2d",
};

const CARD = "card-aspect absolute rounded-[4.75%] shadow-md ring-1 ring-black/60 transition-transform duration-200";

function CardFace({ src, className }: { src: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
  return <img src={src} alt="" loading="lazy" draggable={false} className={cn(CARD, className)} />;
}

/** The quiz: two pieces of art against each other, as on its first card. */
function QuizScene() {
  const half = "absolute inset-0 size-full object-cover transition-transform duration-200";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
      <img
        src={artCropUrl(CARDS.shivanDragon)}
        alt=""
        loading="lazy"
        className={cn(half, "[clip-path:polygon(0_0,61%_0,37%_100%,0_100%)] group-hover:-translate-x-0.5")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
      <img
        src={artCropUrl(CARDS.forest)}
        alt=""
        loading="lazy"
        className={cn(half, "[clip-path:polygon(63%_0,100%_0,100%_100%,39%_100%)] group-hover:translate-x-0.5")}
      />
    </>
  );
}

/** Building: a commander on the stack, leaning into a swipe to the right, with the heart of a pick. */
function BuildScene() {
  return (
    <>
      <CardBack className="absolute top-3 left-6 w-14 -rotate-6 shadow-md" />
      <div className="absolute top-2 left-8 w-14 rotate-3 transition-transform duration-200 group-hover:translate-x-1 group-hover:rotate-[9deg]">
        <CardFace src={cardImageUrl(SHOWCASE_COMMANDERS[0].image, "small")} className="relative w-full" />
        <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-[var(--heart)] ring-2 ring-ink transition-transform duration-200 group-hover:scale-110">
          <HeartShape className="w-2.5" fill="#0b0e13" />
        </span>
      </div>
    </>
  );
}

/** Upgrading: the plain bear steps back, the mana elf comes in. */
function UpgradeScene() {
  return (
    <>
      <CardFace
        src={imageUrlForKey(CARDS.grizzlyBears, "small")}
        className="top-4 left-1.5 w-12 -rotate-[8deg] opacity-55 grayscale group-hover:-translate-x-1 group-hover:translate-y-1"
      />
      <CardFace src={imageUrlForKey(CARDS.llanowarElves, "small")} className="top-2 left-[3.5rem] w-14 rotate-[5deg] group-hover:-translate-x-1" />
      <span className="absolute top-9 left-[2.75rem] grid size-5 place-items-center rounded-full bg-ink text-foreground ring-1 ring-border">
        <SwapIcon className="size-3" />
      </span>
    </>
  );
}

/** Goldfishing: an opening hand held up from the edge of the table. */
function GoldfishScene() {
  const hand = [
    { key: CARDS.forest, className: "left-3 top-7 -rotate-[14deg] group-hover:-rotate-[20deg] group-hover:-translate-x-0.5" },
    { key: CARDS.llanowarElves, className: "left-8 top-4 group-hover:-translate-y-1" },
    { key: CARDS.kodamasReach, className: "left-[3.25rem] top-7 rotate-[14deg] group-hover:rotate-[20deg] group-hover:translate-x-0.5" },
  ];
  return (
    <>
      {hand.map((card) => (
        <CardFace key={card.key} src={imageUrlForKey(card.key, "small")} className={cn("w-12 origin-bottom", card.className)} />
      ))}
    </>
  );
}

const WAYS = [
  { href: "/quiz", question: "No commander yet?", action: "Take the quiz", Scene: QuizScene, ground: "bg-ink" },
  { href: "/build", question: "Know your commander?", action: "Build the deck", Scene: BuildScene, ground: "bg-ink" },
  { href: "/upgrade", question: "Have a precon?", action: "Upgrade it", Scene: UpgradeScene, ground: "bg-ink" },
  { href: "/goldfish", question: "Deck finished?", action: "Play a test hand", Scene: GoldfishScene, ground: "bg-table" },
];

/**
 * Where to go from the home page, by what the visitor already has. Each way in shows what happens
 * there with a few real cards instead of describing it; the scenes shift a little on hover.
 */
export function WaysIn() {
  return (
    <section aria-labelledby="ways-in">
      <h2 id="ways-in" className="sr-only">
        Where to start
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {WAYS.map(({ href, question, action, Scene, ground }) => (
          <Link
            key={href}
            href={href}
            className="group panel flex items-center gap-4 p-2 pr-4 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70"
          >
            <span
              className={cn("relative h-24 w-28 shrink-0 overflow-hidden rounded-md shadow-[inset_0_2px_0_0_oklch(0_0_0/35%)] ring-1 ring-black/40", ground)}
              aria-hidden="true"
            >
              <Scene />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted-foreground">{question}</span>
              <span className="block font-heading text-xl leading-tight font-medium min-[400px]:text-2xl">{action}</span>
            </span>
            <ArrowRightIcon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
