import type { Metadata } from "next";
import Link from "next/link";

import { ManaSymbol } from "@/components/card/mana";
import { JsonLd } from "@/components/json-ld";
import { ColorQuiz } from "@/components/quiz/color-quiz";
import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { COLOR_NAMES, COLORS } from "@/lib/cards/colors";
import { canonical } from "@/lib/metadata";
import { COLOR_PIE } from "@/lib/quiz/color-quiz";
import { webApplicationLd } from "@/lib/structured-data";

const PATH = "/quiz/colors";
const TITLE = "What Magic color are you? A quick swipe quiz";
const DESCRIPTION =
  "Swipe through six quick cards to find the Magic: The Gathering colors that fit you, what each color stands for and the precons that use them.";

const seo = canonical(PATH);

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...seo,
  openGraph: { ...seo.openGraph, title: TITLE, description: DESCRIPTION },
};

export default function ColorQuizPage() {
  return (
    <>
      <JsonLd data={webApplicationLd({ name: TITLE, path: PATH, description: DESCRIPTION })} />
      <h1 className="sr-only">What Magic: The Gathering color are you?</h1>
      {/* The deck comes first: its card is sized to the screen height, so text above it would shrink it. */}
      <ToolScreen>
        <ColorQuiz />
      </ToolScreen>
      <ToolNotes title="The five colors of Magic">
        <p>
          Every Magic card is one or more of five colors, or colorless. Each color stands for its own values, and its
          cards play the way those values suggest.
        </p>
        <ul className="space-y-2">
          {COLORS.map((c) => (
            <li key={c} className="flex items-start gap-3">
              <ManaSymbol symbol={c} className="mt-1 size-5" />
              <span>
                <span className="font-medium text-foreground">{COLOR_NAMES[c]}</span>: {COLOR_PIE[c].short}
              </span>
            </li>
          ))}
        </ul>
        <p>
          Two or more colors together have names of their own, like Golgari for black and green.{" "}
          <Link href="/learn/color-combinations">Magic color combinations and their names</Link>
        </p>
      </ToolNotes>
    </>
  );
}
