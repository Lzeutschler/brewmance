import type { Metadata } from "next";
import Link from "next/link";

import { BuildSetup } from "@/components/build/build-setup";
import { JsonLd } from "@/components/json-ld";
import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { canonical } from "@/lib/metadata";
import { webApplicationLd } from "@/lib/structured-data";

const DESCRIPTION =
  "Pick a commander and swipe right on the cards you want. The deck stays legal and balanced, with enough lands and a sensible spread of costs. Free.";

export const metadata: Metadata = {
  title: "Build a Commander deck by swiping",
  description: DESCRIPTION,
  ...canonical("/build"),
};

export default function BuildPage() {
  return (
    <>
      <ToolScreen>
        <BuildSetup />
      </ToolScreen>
      <ToolNotes title="About the deck builder" wide>
        <p>
          A Commander deck is your commander plus 99 other cards, with only one copy of each card apart from basic
          lands. Here you choose a commander and a power level, then swipe right on the cards you want and left on the
          ones you don’t. While you swipe, the builder counts your lands, ramp (cards that give you extra mana), card
          draw and removal against what a working deck needs. Whenever you like, it fills the open slots for you and
          opens the deck for editing.
        </p>
        <p>
          The cards you see are suggestions based on EDHREC data for your commander. Card details and prices come from
          Scryfall. Your decks are saved in this browser, and you need no account. If this is your first deck, read{" "}
          <Link href="/learn/how-to-build-a-commander-deck">how to build a Commander deck</Link> first. The{" "}
          <Link href="/learn/brackets">guide to brackets</Link> explains the power levels, and{" "}
          <Link href="/learn/how-many-lands">how many lands to play</Link> covers the mana.
        </p>
      </ToolNotes>
      <JsonLd
        data={webApplicationLd({ name: "Commander deck builder", path: "/build", description: DESCRIPTION })}
      />
    </>
  );
}
