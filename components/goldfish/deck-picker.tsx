"use client";

import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { EmptyCauldron } from "@/components/cauldron";
import { ImportDialog } from "@/components/deck/import-dialog";
import { PlayIcon, UploadSimpleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cardImageUrl } from "@/lib/cards/image";
import { deckCount } from "@/lib/decks/stats";
import { deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

export function GoldfishDeckPicker() {
  const hydrated = useDecksHydrated();
  const decks = Object.values(useDeckStore((s) => s.decks)).sort((a, b) => b.updatedAt - a.updatedAt);

  if (!hydrated) return <Skeleton className="h-40 rounded-xl" />;

  return (
    <div className="space-y-4">
      {decks.length === 0 && (
        <EmptyCauldron
          title="Nothing to playtest yet"
          description="Brew a deck first, or import a list below, then bring it to the table."
          actions={
            <Button nativeButton={false} render={<Link href="/build" />}>
              Build a deck
            </Button>
          }
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const count = deckCount(deck.entries);
          const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;
          return (
            <Link
              key={deck.id}
              href={`/goldfish/${deck.id}`}
              className="group panel flex items-center gap-3 overflow-hidden p-2 pr-4 transition hover:-translate-y-0.5 hover:border-brand/70"
            >
              <div
                className="h-16 w-20 shrink-0 rounded-md bg-muted bg-cover bg-center"
                style={art ? { backgroundImage: `url(${art})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg leading-tight font-medium [font-family:var(--font-heading)]">{deck.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ColorIdentity colors={deckIdentity(deck)} />
                  <span className={count === mainDeckSize(deck) ? "tabular-nums" : "text-brand tabular-nums"}>
                    {count}/{mainDeckSize(deck)} cards
                  </span>
                </div>
              </div>
              <PlayIcon className="size-5 text-muted-foreground transition group-hover:text-brand" />
            </Link>
          );
        })}
      </div>
      <ImportDialog>
        <Button variant="outline">
          <UploadSimpleIcon /> Import a deck list
        </Button>
      </ImportDialog>
    </div>
  );
}
