import type { Metadata } from "next";
import Link from "next/link";

import { GoldfishDeckPicker } from "@/components/goldfish/deck-picker";
import { PageHeader } from "@/components/page-header";
import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Test your Commander deck: play a solo game",
  description:
    "Play a solo test game with your Commander deck: draw an opening hand, mulligan, play lands and spells and see how the deck runs before game night.",
  ...canonical("/goldfish"),
};

export default function GoldfishIndexPage() {
  return (
    <>
      <ToolScreen>
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
          <PageHeader
            title="Goldfish"
            description="Test a deck on an empty table: draw, mulligan, play lands and spells, tap, add counters and tokens. Pick a deck to start."
          />
          <GoldfishDeckPicker />
        </div>
      </ToolScreen>
      <ToolNotes title="About goldfishing" wide>
        <p>
          <Link href="/learn/glossary#goldfish">Goldfishing</Link> means playing your deck alone, with no opponent, to
          see how it runs. Here you get an empty table. You draw seven cards and decide whether to keep them or take
          a <Link href="/learn/glossary#mulligan">mulligan</Link>, which means shuffling the hand away and drawing a
          new one. Then you play turn by turn: put down lands, cast spells, tap cards, add counters and make tokens.
          After a few games you notice quickly whether the deck has too few lands or too many expensive cards.
        </p>
        <p>
          It works with any deck saved in this browser: one you built or upgraded here, or a list you import from
          another site. The game runs in your browser with card images from Scryfall, and your deck is not uploaded.
          It is a good last check before you bring a new deck to a game with friends.
        </p>
      </ToolNotes>
    </>
  );
}
