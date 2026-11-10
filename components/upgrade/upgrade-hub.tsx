"use client";

import Link from "next/link";

import { ImportDialog } from "@/components/deck/import-dialog";
import { UploadSimpleIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { artCropUrl } from "@/lib/cards/image";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { canUpgrade } from "@/lib/deckbuilder/upgrade";
import type { Deck } from "@/lib/decks/types";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { PreconPicker } from "./precon-picker";

const MAX_OWN_DECKS = 6;

/** Where an upgrade starts: one of the visitor's decks, an imported list or a precon. */
export function UpgradeHub() {
  const hydrated = useDecksHydrated();
  const decks = useDeckStore((s) => s.decks);
  const upgrades = useDeckStore((s) => s.upgrades);
  const own = hydrated
    ? Object.values(decks)
        .filter((deck) => upgrades[deck.id] || canUpgrade(deck))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_OWN_DECKS)
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8">
      <PageHeader
        title="Upgrade a deck"
        description="Start from a precon or a deck you already play. Brewmance finds the cards that do the least for it and lines up a better match for each: swipe right to swap, left to pass."
        actions={
          <ImportDialog destination={(id) => `/upgrade/${id}`}>
            <Button variant="outline">
              <UploadSimpleIcon /> Import a list
            </Button>
          </ImportDialog>
        }
      />

      {own.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Your decks</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {own.map((deck) => (
              <OwnDeckRow key={deck.id} deck={deck} upgrading={Boolean(upgrades[deck.id])} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{own.length > 0 ? "Or start from a precon" : "Start from a precon"}</h2>
        <PreconPicker />
      </section>
    </div>
  );
}

function OwnDeckRow({ deck, upgrading }: { deck: Deck; upgrading: boolean }) {
  return (
    <Link
      href={`/upgrade/${deck.id}`}
      className="panel flex items-center gap-3 p-1.5 pr-3 transition hover:-translate-y-0.5 hover:border-brand/70"
    >
      <span
        className="h-14 w-20 shrink-0 rounded-md bg-muted bg-cover bg-[center_25%]"
        style={deck.commander.image ? { backgroundImage: `url(${artCropUrl(deck.commander.image.key)})` } : undefined}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-lg leading-tight font-bold">{deck.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          Bracket {deck.bracket} {BRACKET_INFO[deck.bracket].name}
          {deck.precon ? " · Precon" : ""}
        </span>
      </span>
      {upgrading && <Badge>Upgrading</Badge>}
    </Link>
  );
}
