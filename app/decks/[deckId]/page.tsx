import type { Metadata } from "next";
import { Suspense } from "react";

import { DeckEditor } from "@/components/deck/deck-editor";
import { canonical } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/decks/[deckId]">): Promise<Metadata> {
  return { title: "Deck", robots: { index: false, follow: true }, ...canonical(`/decks/${(await params).deckId}`) };
}

export default function DeckPage({ params }: PageProps<"/decks/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <DeckEditor deckId={deckId} />
      ))}
    </Suspense>
  );
}
