import type { Metadata } from "next";
import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { BrewScene } from "@/components/home/brew-scene";
import { SwipeShowcase } from "@/components/home/swipe-showcase";
import { ArrowRightIcon, ManaGlyph, type ManaGlyphName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { canonical } from "@/lib/metadata";
import { SITE } from "@/lib/site";

export const metadata: Metadata = canonical("/");

interface Feature {
  /** Who this way in is for, set like the type line of a card. */
  lead: string;
  title: string;
  text: string;
  href: string;
  glyph: ManaGlyphName;
  action: string;
}

/** The three ways into a deck, by what the visitor already has. */
const STARTS: Feature[] = [
  {
    lead: "New to Commander",
    title: "Find your commander",
    text: "Swipe yes or no on play styles, colors and creatures — or just vibes — then meet the commanders that fit you.",
    href: "/quiz",
    glyph: "planeswalker",
    action: "Take the quiz",
  },
  {
    lead: "You know your commander",
    title: "Deck Matchmaker",
    text: "Pick a commander and bracket, then swipe through cards. Curve, ramp, draw and removal stay balanced, and the deck stays in its bracket.",
    href: "/build",
    glyph: "creature",
    action: "Start a deck",
  },
  {
    lead: "You own a precon or a deck",
    title: "Upgrade swipe",
    text: "Each swipe is a swap: the weakest card goes, a better match comes in, within your budget.",
    href: "/upgrade",
    glyph: "artifact",
    action: "Upgrade a deck",
  },
];

/** Where every deck ends up, whichever way it started. */
const GOLDFISH: Feature = {
  lead: "Then test it",
  title: "Goldfish",
  text: "Play the deck against nobody in an Arena-style sandbox: draw, play, tap and mulligan without the clunky UI.",
  href: "/goldfish",
  glyph: "tap",
  action: "Open the table",
};

const FRAME =
  "group rounded-xl border-4 border-ink bg-secondary p-2 shadow-lg ring-1 ring-border transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:ring-brand";

/** A way in, drawn like a card: name bar with its symbol, type line, rules box and the action. */
function StartCard({ lead, title, text, href, glyph, action }: Feature) {
  return (
    <Link href={href} className={`${FRAME} flex flex-col gap-2`}>
      <span className="flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2 shadow-sm">
        <span className="font-heading text-xl leading-tight font-medium">{title}</span>
        <ManaGlyph name={glyph} className="text-xl text-muted-foreground" />
      </span>
      <span className="ui-label px-3 text-muted-foreground">{lead}</span>
      <span className="flex-1 rounded-md bg-ink/60 px-3 py-3 text-sm leading-relaxed text-muted-foreground">{text}</span>
      <CardAction>{action}</CardAction>
    </Link>
  );
}

function CardAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`ui-label flex items-center justify-between gap-4 rounded-md bg-card px-3 py-2 text-foreground ${className ?? ""}`}>
      {children}
      <span className="text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden>
        ›
      </span>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 pt-8 pb-12 sm:py-16">
      {/* Clipped sideways: the swiped cards fly out of the scene. */}
      <section className="grid items-center gap-10 overflow-x-clip md:grid-cols-[1.2fr_1fr]">
        {/* On a phone the swipe stack comes right under the headline, then the buttons, then the pitch. */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <h1 className="text-[2.6rem] leading-[1.06] font-medium min-[400px]:text-5xl sm:text-6xl md:text-5xl lg:text-6xl">
            {/* Hyphenated words such as "bracket-legal" stay on one line. */}
            {SITE.tagline.split(/(\S+-\S+)/).map((part, i) =>
              i % 2 ? (
                <span key={i} className="whitespace-nowrap">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </h1>
          <SwipeShowcase className="py-1 text-[14px] min-[400px]:text-[15px] md:hidden" />
          <p className="order-1 max-w-xl text-lg text-muted-foreground md:order-none">
            Pick a commander and a bracket, then swipe right on the cards you love. Ramp, draw, removal and the mana
            curve stay on target, and Game Changers and two-card combos stay within your bracket. Then goldfish the
            deck right here: free, no account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/build" />}>
              Start building <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/decks" />}>
              My decks
            </Button>
          </div>
        </div>
        <div className="hidden justify-center md:flex md:justify-end">
          <BrewScene className="text-[9px] lg:text-[11px]" />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="ways-in">
        <h2 id="ways-in" className="text-3xl font-medium">Three ways in</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STARTS.map((start) => (
            <StartCard key={start.href} {...start} />
          ))}
        </div>
        {/* The same card laid on its side: every deck ends up here. */}
        <Link href={GOLDFISH.href} className={`${FRAME} flex flex-col gap-2 md:flex-row md:items-stretch`}>
          <span className="flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2 shadow-sm md:w-60 md:shrink-0">
            <span className="font-heading text-xl leading-tight font-medium">{GOLDFISH.title}</span>
            <ManaGlyph name={GOLDFISH.glyph} className="text-xl text-muted-foreground" />
          </span>
          <span className="flex-1 rounded-md bg-ink/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            <span className="ui-label text-foreground">{GOLDFISH.lead}</span> · {GOLDFISH.text}
          </span>
          <CardAction className="md:shrink-0">{GOLDFISH.action}</CardAction>
        </Link>
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-medium">Recent decks</h2>
          <Link href="/decks" className="ui-label text-muted-foreground hover:text-foreground">
            All decks
          </Link>
        </div>
        <DeckList limit={6} />
      </section>
    </div>
  );
}
