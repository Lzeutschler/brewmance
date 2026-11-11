import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { QuizScreen } from "@/components/quiz/quiz-screen";
import { ToolNotes, ToolScreen } from "@/components/tool-notes";
import { canonical } from "@/lib/metadata";
import { webApplicationLd } from "@/lib/structured-data";

const DESCRIPTION =
  "Answer a few short questions about how you like to play and get a shortlist of commanders that suit you. Made for new players too. Free, no account.";

export const metadata: Metadata = {
  title: "Commander quiz: find the commander that fits you",
  description: DESCRIPTION,
  ...canonical("/quiz"),
};

export default function QuizPage() {
  return (
    <>
      <h1 className="sr-only">Commander quiz</h1>
      <ToolScreen>
        <QuizScreen />
      </ToolScreen>
      <ToolNotes title="About the commander quiz">
        <p>
          In Commander, your deck is led by one legendary creature, the commander, and its colors decide which cards
          the deck may use. Picking it is the first big choice. This quiz asks how you like to play, one card at a
          time: swipe right for yes, left for no. Then you swipe through commanders that match your answers and keep
          the ones you like on a shortlist, ready to build a deck around. If you are new to the game, choose “I’m new
          to Commander” on the first card. Those questions use plain words instead of game terms.
        </p>
        <p>
          Commanders and card details come from Scryfall. The popularity setting uses EDHREC’s ranking of how often
          each commander is played. Your answers are saved in this browser. To settle on colors first, try the{" "}
          <Link href="/quiz/colors">color quiz</Link>. To start from a ready-made deck instead,{" "}
          <Link href="/precons/find">find a precon that suits you</Link>. For how the format works, see{" "}
          <Link href="/learn">the beginner guides</Link>.
        </p>
      </ToolNotes>
      <JsonLd data={webApplicationLd({ name: "Commander quiz", path: "/quiz", description: DESCRIPTION })} />
    </>
  );
}
