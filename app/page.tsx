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

/** Each feature is drawn like a card: a name bar with its symbol, a rules box and a type line with the action. */
const FEATURES: { title: string; text: string; href: string; glyph: ManaGlyphName; action: string }[] = [
  {
    title: "Find your commander",
    text: "Swipe yes or no on play styles, colors and creatures — or just vibes — then meet the commanders that fit you.",
    href: "/quiz",
    glyph: "planeswalker",
    action: "Take the quiz",
  },
  {
    title: "Deck Matchmaker",
    text: "Pick a commander and bracket, then swipe through cards. Curve, ramp, draw and removal stay balanced, and the deck stays in its bracket.",
    href: "/build",
    glyph: "creature",
    action: "Start a deck",
  },
  {
    title: "Upgrade a precon",
    text: "Bring a precon or a deck you already play. Each swipe is a swap: the weakest card goes, a better match comes in, within your budget.",
    href: "/upgrade",
    glyph: "artifact",
    action: "Upgrade a deck",
  },
  {
    title: "Goldfish",
    text: "Test your deck in an Arena-style sandbox: draw, play, tap and mulligan without the clunky UI.",
    href: "/goldfish",
    glyph: "tap",
    action: "Open the table",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 pt-8 pb-12 sm:py-16">
      {/* Clipped sideways: the swiped cards fly out of the scene. */}
      <section className="grid items-center gap-10 overflow-x-clip md:grid-cols-[1.2fr_1fr]">
        {/* On a phone the swipe stack comes right under the headline, then the buttons, then the pitch. */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <h1 className="text-[2.6rem] leading-[1.06] font-extrabold min-[400px]:text-5xl sm:text-6xl md:text-5xl lg:text-6xl">
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Features">
        {FEATURES.map(({ title, text, href, glyph, action }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-1.5 rounded-xl border-[5px] border-ink bg-secondary p-1.5 shadow-lg ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-brand"
          >
            <span className="flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2 shadow-sm">
              <span className="font-heading text-xl leading-tight font-bold">{title}</span>
              <ManaGlyph name={glyph} className="text-xl text-brand" />
            </span>
            <span className="flex-1 rounded-md bg-ink/60 px-3 py-3 text-sm leading-relaxed text-muted-foreground">{text}</span>
            <span className="ui-label flex items-center justify-between rounded-md bg-card px-3 py-2 text-foreground">
              {action}
              <span className="text-brand transition group-hover:translate-x-0.5" aria-hidden>
                ›
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold">Recent decks</h2>
          <Link href="/decks" className="ui-label text-muted-foreground hover:text-foreground">
            All decks
          </Link>
        </div>
        <DeckList limit={6} />
      </section>
    </div>
  );
}
