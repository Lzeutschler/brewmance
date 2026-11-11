import type { Metadata } from "next";
import Link from "next/link";

import { Term } from "@/components/learn/learn-prose";
import { PreconFinder } from "@/components/precons/precon-finder";
import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { canonical } from "@/lib/metadata";

const PATH = "/precons/find";
const TITLE = "Find your Commander precon: a quick swipe quiz";
const DESCRIPTION =
  "New to Magic? Answer a few swipe questions about the colors and games you like, and see which ready-to-play Commander decks fit you best.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...canonical(PATH),
  openGraph: { ...canonical(PATH).openGraph, title: TITLE, description: DESCRIPTION },
};

export default function FindPreconPage() {
  return (
    <>
      {/* A visible heading above the deck would shrink the card, which is sized to the viewport height. */}
      <h1 className="sr-only">Find your Commander precon</h1>
      <ToolScreen>
        <PreconFinder />
      </ToolScreen>
      <ToolNotes title="How the finder picks">
        <p>
          A <Term id="precon">precon</Term> is a ready-to-play Commander deck you can buy in a store. The finder compares every
          precon with your answers. Your colors and favorite worlds count the most, then how the deck&apos;s{" "}
          <Term id="commander">commander</Term>, the legendary creature that leads it, likes to play.
        </p>
        <p>Nothing is saved. Each deck it suggests has its own page with the full card list.</p>
        <p className="flex flex-wrap gap-x-5">
          <Link href="/precons" className="inline-flex min-h-10 items-center">
            Browse all precons
          </Link>
          <Link href="/learn/how-to-play-commander" className="inline-flex min-h-10 items-center">
            How to play Commander
          </Link>
        </p>
      </ToolNotes>
    </>
  );
}
