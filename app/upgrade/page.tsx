import type { Metadata } from "next";

import { UpgradeHub } from "@/components/upgrade/upgrade-hub";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Upgrade a deck",
  description:
    "Upgrade a Commander precon or your own deck by swiping: each card shows the weakest card in the deck and a better match for it.",
  ...canonical("/upgrade"),
};

export default function UpgradePage() {
  return <UpgradeHub />;
}
