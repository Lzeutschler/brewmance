"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CircleNotchIcon, PlayIcon, SwapIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ensurePreconDeck, missingCardsMessage } from "@/lib/precons/open";
import { cn } from "@/lib/utils";
import { useDecksHydrated } from "@/stores/decks";

type Action = "upgrade" | "play";

const DESTINATION: Record<Action, (deckId: string) => string> = {
  upgrade: (deckId) => `/upgrade/${deckId}`,
  play: (deckId) => `/goldfish/${deckId}`,
};

/**
 * Opens a precon in the upgrade flow or the goldfish table. Both save it as a deck first, or reuse a saved
 * copy that was never changed, so the two buttons share one deck.
 */
export function PreconActions({
  precon,
  canUpgrade,
  className,
}: {
  precon: { id: string; name: string };
  canUpgrade: boolean;
  className?: string;
}) {
  const router = useRouter();
  const hydrated = useDecksHydrated();
  const [busy, setBusy] = useState<Action | null>(null);

  const open = async (action: Action) => {
    if (busy) return;
    setBusy(action);
    try {
      const { deckId, missing } = await ensurePreconDeck(precon.id);
      if (missing.length) toast.warning(missingCardsMessage(missing));
      router.push(DESTINATION[action](deckId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load this precon");
      setBusy(null);
    }
  };

  const disabled = !hydrated || busy !== null;
  const icon = (action: Action, Idle: typeof PlayIcon) =>
    busy === action ? <CircleNotchIcon className="animate-spin" /> : <Idle />;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {canUpgrade && (
        <Button disabled={disabled} aria-busy={busy === "upgrade"} onClick={() => open("upgrade")}>
          {icon("upgrade", SwapIcon)} Upgrade this deck
        </Button>
      )}
      <Button variant="outline" disabled={disabled} aria-busy={busy === "play"} onClick={() => open("play")}>
        {icon("play", PlayIcon)} Play a test hand
      </Button>
    </div>
  );
}
