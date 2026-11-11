import type { Metadata } from "next";
import { Suspense } from "react";

import { GoldfishScreen } from "@/components/goldfish/goldfish-screen";
import { canonical } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/goldfish/[deckId]">): Promise<Metadata> {
  return { title: "Goldfish", robots: { index: false, follow: true }, ...canonical(`/goldfish/${(await params).deckId}`) };
}

export default function GoldfishPage({ params }: PageProps<"/goldfish/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <GoldfishScreen deckId={deckId} />
      ))}
    </Suspense>
  );
}
