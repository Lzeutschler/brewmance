import type { Metadata } from "next";
import Link from "next/link";

import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { UpgradeHub } from "@/components/upgrade/upgrade-hub";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Upgrade a Commander precon or your own deck",
  description:
    "Make a ready-made Commander deck or your own list stronger by swiping: each card pairs a weak card in the deck with a better one, within your budget.",
  ...canonical("/upgrade"),
};

export default function UpgradePage() {
  return (
    <>
      <ToolScreen>
        <UpgradeHub />
      </ToolScreen>
      <ToolNotes title="About deck upgrades" wide>
        <p>
          A precon is a preconstructed Commander deck, sold ready to play in one box. Precons are a good way into the
          game, and most of them have a few cards that do little for the deck. This tool finds those cards and shows
          them one at a time, each next to a better match. Swipe right to make the swap, left to pass and leave the
          deck as it is. You set a budget for the new cards first, and at the end you get the full list, ready to edit or
          export. It works the same way with your own deck, either one you built here or a list you import.
        </p>
        <p>
          Precon decklists come from MTGJSON, card details and prices from Scryfall, and the suggested cards from
          EDHREC data. To see every Commander precon with its cards, go to <Link href="/precons">all precons</Link>.
          If you have not bought one yet, <Link href="/precons/find">find your precon</Link> with a short quiz that
          suggests decks you might enjoy.
        </p>
      </ToolNotes>
    </>
  );
}
