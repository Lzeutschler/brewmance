import type { Metadata } from "next";
import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { BrewScene } from "@/components/home/brew-scene";
import { SwipeShowcase } from "@/components/home/swipe-showcase";
import { WaysIn } from "@/components/home/ways-in";
import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { canonical } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { webApplicationLd, websiteLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} · Build your first Commander deck by swiping` },
  description:
    "Find a commander with a short quiz, build your first Commander deck by swiping, upgrade a precon and test your deck on an empty table. Free, no account.",
  ...canonical("/"),
};

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 pt-8 pb-12 sm:py-16">
      <JsonLd data={[websiteLd(), webApplicationLd()]} />
      {/* Clipped sideways: the swiped cards fly out of the scene. The brew bubbles faster while the main button is hovered. */}
      <section className="grid items-center gap-10 overflow-x-clip has-[[data-cta]:focus-visible]:[--brew-bubble:0.9s] has-[[data-cta]:hover]:[--brew-bubble:0.9s] md:grid-cols-[1.2fr_1fr]">
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
            <Button size="lg" nativeButton={false} render={<Link href="/build" />} data-cta>
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

      <WaysIn />

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
