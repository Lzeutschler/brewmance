import type { Metadata } from "next";
import { Suspense } from "react";

import { SwipeScreen } from "@/components/swipe/swipe-screen";
import { canonical } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/build/[deckId]">): Promise<Metadata> {
  return { title: "Swipe", robots: { index: false, follow: true }, ...canonical(`/build/${(await params).deckId}`) };
}

export default function SwipePage({ params }: PageProps<"/build/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <SwipeScreen deckId={deckId} />
      ))}
    </Suspense>
  );
}
