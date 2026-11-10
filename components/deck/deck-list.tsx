"use client";

import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { EmptyCauldron } from "@/components/cauldron";
import { PlusIcon, UploadSimpleIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cardImageUrl } from "@/lib/cards/image";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { deckCount } from "@/lib/decks/stats";
import { deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { ImportDialog } from "./import-dialog";

export function DeckList({ limit }: { limit?: number }) {
  const hydrated = useDecksHydrated();
  const decks = useDeckStore((s) => s.decks);
  const sessions = useDeckStore((s) => s.sessions);
  const upgrades = useDeckStore((s) => s.upgrades);
  const sorted = Object.values(decks).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <EmptyCauldron
        title="Your cauldron is empty"
        description="Brew your first deck by swiping, or pour in a list you already have."
        actions={
          <>
            <Button nativeButton={false} render={<Link href="/build" />}>
              <PlusIcon /> Build a deck
            </Button>
            <ImportDialog>
              <Button variant="outline">
                <UploadSimpleIcon /> Import
              </Button>
            </ImportDialog>
          </>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((deck) => (
        <DeckTile key={deck.id} deck={deck} inProgress={Boolean(sessions[deck.id])} upgrading={Boolean(upgrades[deck.id])} />
      ))}
    </div>
  );
}

/** A deck as a framed art crop with a name plate below, like a card's title and type line. */
function DeckTile({ deck, inProgress, upgrading }: { deck: Deck; inProgress: boolean; upgrading: boolean }) {
  const count = deckCount(deck.entries);
  const identity = deckIdentity(deck);
  const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;
  return (
    <Link
      href={inProgress ? `/build/${deck.id}` : upgrading ? `/upgrade/${deck.id}` : `/decks/${deck.id}`}
      className="group panel flex flex-col overflow-hidden p-1.5 transition hover:-translate-y-1 hover:-rotate-[0.6deg] hover:border-brand/70"
    >
      <div className="relative h-32 overflow-hidden rounded-md bg-muted">
        {art && (
          <div
            className="absolute inset-0 bg-cover bg-[center_25%] transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${art})` }}
          />
        )}
        {(inProgress || upgrading) && <Badge className="absolute top-2 left-2">{inProgress ? "Brewing" : "Upgrading"}</Badge>}
      </div>
      {/* The commanders' colors as a thin band, like the frame color of a card. */}
      <div className="mt-1.5 flex h-1.5 gap-px overflow-hidden rounded-xs" aria-hidden="true">
        {(identity.length ? identity : ["C"]).map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: `var(--mana-${color.toLowerCase()})` }} />
        ))}
      </div>
      <div className="space-y-1 px-2 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-xl leading-tight font-bold">{deck.name}</h3>
          <ColorIdentity colors={identity} />
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="tabular-nums">
            {count}/{mainDeckSize(deck)}
          </span>{" "}
          cards · Bracket {deck.bracket} {BRACKET_INFO[deck.bracket].name}
        </p>
      </div>
    </Link>
  );
}
