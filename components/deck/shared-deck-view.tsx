"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardSheet } from "@/components/card/card-sheet";
import { ColorIdentity, ManaCost } from "@/components/card/mana";
import { EdhrecLink } from "@/components/edhrec-link";
import { DownloadSimpleIcon, HeartIcon, PlayIcon, WarningIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Card } from "@/lib/cards/types";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { DEFAULT_SETTINGS } from "@/lib/deckbuilder/settings";
import { commandZone, deckIdentity } from "@/lib/decks/command-zone";
import { CARD_TYPES, deckCount, primaryType, type CardType } from "@/lib/decks/stats";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import type { Deck } from "@/lib/decks/types";
import type { ResolvedSharedDeck } from "@/lib/server/shared-deck";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { CommandZoneCards } from "./command-zone-cards";
import { DeckStatsPanel } from "./deck-stats-panel";
import { ExportDialog } from "./export-dialog";

const GROUP_ORDER: CardType[] = [...CARD_TYPES, "Other"];

/** A deck someone shared by link: read-only, with a way to keep a copy, goldfish it or brew your own. */
export function SharedDeckView({ shared }: { shared: ResolvedSharedDeck }) {
  const router = useRouter();
  const hydrated = useDecksHydrated();
  const createDeck = useDeckStore((s) => s.createDeck);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [inspected, setInspected] = useState<Card | null>(null);

  // The stats panel and the export work on a full deck, so the shared one gets default settings.
  const deck = useMemo<Deck>(
    () => ({ id: "shared", ...shared, maybe: [], settings: DEFAULT_SETTINGS, createdAt: 0, updatedAt: 0 }),
    [shared],
  );

  // One copy per visit, whether the visitor saves first or goldfishes first.
  const save = () => {
    if (savedId) return savedId;
    const id = createDeck({
      commander: deck.commander,
      partner: deck.partner,
      bracket: deck.bracket,
      theme: deck.theme,
      name: deck.name,
      entries: deck.entries,
    });
    setSavedId(id);
    return id;
  };

  const groups = GROUP_ORDER.map((type) => ({
    type,
    entries: deck.entries
      .filter((e) => primaryType(e.card) === type)
      .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name)),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <header className="panel flex flex-col gap-5 p-4 sm:p-5 md:flex-row">
        <CommandZoneCards deck={deck} />
        <div className="flex flex-1 flex-col gap-4">
          <div className="space-y-1">
            <p className="ui-label text-muted-foreground">Shared deck</p>
            <h1 className="font-heading text-3xl leading-tight font-medium md:text-4xl">{deck.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <ColorIdentity colors={deckIdentity(deck)} />
            <span>{commandZone(deck).map((c) => c.name).join(" & ")}</span>
            <span>·</span>
            <span>
              Bracket {deck.bracket} – {BRACKET_INFO[deck.bracket].name}
            </span>
            <span>·</span>
            <span className="tabular-nums">{deckCount(deck.entries) + commandZone(deck).length} cards</span>
            <span>·</span>
            <EdhrecLink href={edhrecCommanderUrl(commandZone(deck), deck.bracket, deck.theme)}>Compare on EDHREC</EdhrecLink>
          </div>
          {shared.missing.length > 0 && (
            <p className="flex gap-2 text-sm text-maybe">
              <WarningIcon className="mt-0.5 size-4 shrink-0" />
              {shared.missing.length} card{shared.missing.length > 1 ? "s" : ""} from the link could not be found:{" "}
              {shared.missing.slice(0, 5).join(", ")}
              {shared.missing.length > 5 ? " …" : ""}
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2">
            <Button disabled={!hydrated} onClick={() => router.push(`/goldfish/${save()}`)}>
              <PlayIcon /> Goldfish this deck
            </Button>
            <Button
              variant="outline"
              disabled={!hydrated}
              onClick={() => {
                const id = save();
                toast.success("Saved to your decks");
                router.push(`/decks/${id}`);
              }}
            >
              <HeartIcon /> Save to my decks
            </Button>
            <ExportDialog deck={deck}>
              <Button variant="outline">
                <DownloadSimpleIcon /> Export
              </Button>
            </ExportDialog>
          </div>
          <p className="text-xs text-muted-foreground">Saving keeps a copy in this browser to edit, swipe and goldfish.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="columns-1 gap-5 md:columns-2">
            {groups.map((group) => (
              <section key={group.type} className="mb-5 break-inside-avoid">
                <h2 className="ui-label mb-2 flex items-baseline gap-2 text-muted-foreground">
                  {group.type === "Other" ? "Other" : `${group.type}s`.replace("Sorcerys", "Sorceries")}
                  <span className="text-foreground tabular-nums">{deckCount(group.entries)}</span>
                </h2>
                <ul className="panel divide-y divide-border/60 p-1">
                  {group.entries.map(({ card, quantity }) => (
                    <CardHoverPreview key={card.id} card={card}>
                      <li className="flex min-h-10 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                        <span className="w-5 text-right text-muted-foreground tabular-nums">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setInspected(card)}
                          className={cn("min-h-9 flex-1 truncate text-left hover:underline", card.gameChanger && "text-brand")}
                          title={card.gameChanger ? "Game Changer" : undefined}
                        >
                          {card.name}
                        </button>
                        <ManaCost cost={card.manaCost} className="shrink-0" />
                      </li>
                    </CardHoverPreview>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="panel flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-medium">Brew your own</h2>
              <p className="text-sm text-muted-foreground">
                Swipe through cards for any commander. The deck stays balanced and within its bracket.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" nativeButton={false} render={<Link href="/quiz" />}>
                Find a commander
              </Button>
              <Button nativeButton={false} render={<Link href="/build" />}>
                Start a deck
              </Button>
            </div>
          </section>
        </div>

        <aside>
          <DeckStatsPanel deck={deck} />
        </aside>
      </div>

      <CardSheet card={inspected} onClose={() => setInspected(null)} />
    </div>
  );
}
