import type { Metadata } from "next";
import { Suspense } from "react";

import { UpgradeScreen } from "@/components/upgrade/upgrade-screen";
import { canonical } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/upgrade/[deckId]">): Promise<Metadata> {
  return { title: "Upgrade", ...canonical(`/upgrade/${(await params).deckId}`) };
}

export default function UpgradeDeckPage({ params }: PageProps<"/upgrade/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <UpgradeScreen deckId={deckId} />
      ))}
    </Suspense>
  );
}
