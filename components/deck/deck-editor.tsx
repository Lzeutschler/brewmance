"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardImage } from "@/components/card/card-image";
import { CardSheet, isTouchScreen } from "@/components/card/card-sheet";
import { ColorIdentity, ManaCost } from "@/components/card/mana";
import { EmptyCauldron } from "@/components/cauldron";
import { EdhrecLink } from "@/components/edhrec-link";
import {
  ArrowLeftIcon,
  CardsIcon,
  DownloadSimpleIcon,
  HeartIcon,
  ListIcon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  SwapIcon,
  TrashIcon,
} from "@/components/icons";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allowsMultipleCopies } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { BRACKET_INFO, bracketViolation } from "@/lib/deckbuilder/brackets";
import { canUpgrade } from "@/lib/deckbuilder/upgrade";
import { CARD_TYPES, deckCount, expandEntries, primaryType, type CardType } from "@/lib/decks/stats";
import { commandZone, deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import type { Deck, DeckEntry } from "@/lib/decks/types";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";
import { sharedDeckText } from "@/lib/share/deck";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { AddCardSearch } from "./add-card-search";
import { CommandZoneCards } from "./command-zone-cards";
import { DeckStatsPanel } from "./deck-stats-panel";
import { ExportDialog } from "./export-dialog";

const GROUP_ORDER: CardType[] = [...CARD_TYPES, "Other"];

export function DeckEditor({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const hasSession = useDeckStore((s) => Boolean(s.sessions[deckId]));
  const upgrading = useDeckStore((s) => Boolean(s.upgrades[deckId]));

  if (!hydrated) return null;
  if (!deck) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        This deck does not exist on this device.
        <Link href="/decks" className="text-brand underline underline-offset-4">
          Back to my decks
        </Link>
      </div>
    );
  }
  return <Editor deck={deck} hasSession={hasSession} upgrading={upgrading} />;
}

function Editor({ deck, hasSession, upgrading }: { deck: Deck; hasSession: boolean; upgrading: boolean }) {
  const router = useRouter();
  const updateDeck = useDeckStore((s) => s.updateDeck);
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const [view, setView] = useState<"list" | "visual">("list");
  // The card opened big; it closes by itself once it is neither in the deck nor on the maybe list.
  const [inspected, setInspected] = useState<Card | null>(null);
  const inspectedEntry = inspected ? deck.entries.find((e) => e.card.id === inspected.id) : undefined;
  const inspectedMaybe = inspected !== null && deck.maybe.some((c) => c.id === inspected.id);

  // A full deck has nothing left to swipe in, so the upgrade becomes the main action.
  const complete = !hasSession && deckCount(deck.entries) >= mainDeckSize(deck);

  const update = (fn: (deck: Deck) => Deck) => updateDeck(deck.id, fn);
  const upgradeButton = (upgrading || canUpgrade(deck)) && (
    <Button variant={complete ? "default" : "outline"} nativeButton={false} render={<Link href={`/upgrade/${deck.id}`} />}>
      <SwapIcon /> {upgrading ? "Continue upgrade" : "Upgrade"}
    </Button>
  );

  const addCard = (card: Card) => {
    const existing = deck.entries.find((e) => e.card.id === card.id);
    if (existing && !allowsMultipleCopies(card.name, card.oracleText)) {
      toast.info(`${card.name} is already in the deck`);
      return;
    }
    const violation = bracketViolation(card, expandEntries(deck.entries), deck.bracket);
    if (violation) toast.warning(`${card.name}: ${violation}`);
    update((d) => ({
      ...d,
      entries: existing
        ? d.entries.map((e) => (e.card.id === card.id ? { ...e, quantity: e.quantity + 1 } : e))
        : [...d.entries, { card, quantity: 1 }],
      maybe: d.maybe.filter((m) => m.id !== card.id),
    }));
  };

  const changeQuantity = (entry: DeckEntry, delta: number) =>
    update((d) => ({
      ...d,
      entries: d.entries
        .map((e) => (e.card.id === entry.card.id ? { ...e, quantity: e.quantity + delta } : e))
        .filter((e) => e.quantity > 0),
    }));

  const moveToMaybe = (entry: DeckEntry) =>
    update((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.card.id !== entry.card.id),
      maybe: [...d.maybe, entry.card],
    }));

  const remove = () => {
    if (!window.confirm(`Delete "${deck.name}"? This cannot be undone.`)) return;
    deleteDeck(deck.id);
    router.push("/decks");
  };

  const groups = GROUP_ORDER.map((type) => ({
    type,
    entries: deck.entries
      .filter((e) => primaryType(e.card) === type)
      .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name)),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <Link href="/decks" className="ui-label -my-2 inline-flex min-h-10 items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> My decks
      </Link>

      <header className="panel flex flex-col gap-5 p-4 sm:p-5 md:flex-row">
        <CommandZoneCards deck={deck} />
        <div className="flex flex-1 flex-col gap-4">
          <Input
            key={deck.name}
            defaultValue={deck.name}
            aria-label="Deck name"
            onBlur={(e) => {
              const name = e.currentTarget.value.trim();
              if (name && name !== deck.name) update((d) => ({ ...d, name }));
            }}
            className="h-auto border-transparent bg-transparent px-2 -mx-2 font-heading text-3xl leading-tight font-medium shadow-none hover:border-input md:text-4xl"
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ColorIdentity colors={deckIdentity(deck)} />
            <span>{commandZone(deck).map((c) => c.name).join(" & ")}</span>
            <span>·</span>
            <label className="flex items-center gap-2">
              Bracket
              <select
                value={deck.bracket}
                onChange={(e) => update((d) => ({ ...d, bracket: Number(e.target.value) as Bracket }))}
                className="h-10 rounded-md border border-input bg-card px-2 text-foreground shadow-sm"
              >
                {BRACKETS.map((b) => (
                  <option key={b} value={b}>
                    {b} – {BRACKET_INFO[b].name}
                  </option>
                ))}
              </select>
            </label>
            <EdhrecLink href={edhrecCommanderUrl(commandZone(deck), deck.bracket, deck.theme)}>Compare on EDHREC</EdhrecLink>
          </div>
          {/* One main action: swiping while cards are missing, the upgrade once the deck is full. */}
          <div className="mt-auto flex flex-wrap items-center gap-2">
            {complete && upgradeButton}
            <Button variant={complete ? "outline" : "default"} nativeButton={false} render={<Link href={`/build/${deck.id}`} />}>
              <HeartIcon /> {hasSession ? "Continue swiping" : "Swipe more cards"}
            </Button>
            {!complete && upgradeButton}
            <Button variant="outline" nativeButton={false} render={<Link href={`/goldfish/${deck.id}`} />}>
              <PlayIcon /> Goldfish
            </Button>
            <span className="mx-1 h-6 w-px bg-border max-sm:hidden" aria-hidden />
            <ExportDialog deck={deck}>
              <Button variant="ghost">
                <DownloadSimpleIcon /> Export
              </Button>
            </ExportDialog>
            <ShareButton
              variant="ghost"
              route="/d"
              text={sharedDeckText(deck)}
              title={deck.name}
              description="Anyone with the link can see, goldfish and copy this deck."
            />
            <Button variant="ghost" className="hover:bg-destructive/12 hover:text-destructive sm:ml-auto" onClick={remove}>
              <TrashIcon /> Delete
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <div className="flex gap-2">
            <div className="flex-1">
              <AddCardSearch identity={deckIdentity(deck)} onAdd={addCard} />
            </div>
            <div className="flex gap-0.5 rounded-md border border-border bg-ink p-0.5">
              <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
                <ListIcon className="size-4" />
              </ViewButton>
              <ViewButton active={view === "visual"} onClick={() => setView("visual")} label="Visual view">
                <CardsIcon className="size-4" />
              </ViewButton>
            </div>
          </div>

          {deck.entries.length === 0 && (
            <EmptyCauldron title="Nothing in the brew yet" description="Swipe some cards in, or add them with the search above." />
          )}

          <div className={cn(view === "list" ? "columns-1 gap-5 md:columns-2" : "flex flex-wrap items-start gap-x-4")}>
            {groups.map((group) => {
              const count = group.entries.reduce((s, e) => s + e.quantity, 0);
              return (
                <section
                  key={group.type}
                  className={cn("mb-5 break-inside-avoid", view === "visual" && "w-[calc(50%-0.5rem)] sm:w-[clamp(150px,15vw,200px)]")}
                >
                  <h3 className="ui-label mb-2 flex items-baseline gap-2 text-muted-foreground">
                    {group.type === "Other" ? "Other" : `${group.type}s`.replace("Sorcerys", "Sorceries")}
                    <span className="text-foreground tabular-nums">{count}</span>
                  </h3>
                  {view === "list" ? (
                    <ul className="panel divide-y divide-border/60 p-1">
                      {group.entries.map((entry) => (
                        <CardRow
                          key={entry.card.id}
                          entry={entry}
                          onAdd={() => addCard(entry.card)}
                          onRemove={() => changeQuantity(entry, -1)}
                          onMaybe={() => moveToMaybe(entry)}
                          onInspect={() => setInspected(entry.card)}
                        />
                      ))}
                    </ul>
                  ) : (
                    // A stack per type: each card shows its title bar, the hovered one comes to the front.
                    <div className="flex flex-col pb-1">
                      {group.entries.map((entry, i) => (
                        <CardHoverPreview key={entry.card.id} card={entry.card}>
                          <button
                            type="button"
                            // Touch screens cannot hover to read the card, so a tap opens it instead of removing one.
                            onClick={() => (isTouchScreen() ? setInspected(entry.card) : changeQuantity(entry, -1))}
                            title={`${entry.card.name} · click to remove one`}
                            aria-label={`Remove one ${entry.card.name}`}
                            className={cn(
                              "group relative block rounded-[4.75%] transition-transform hover:z-10 hover:-translate-y-1 focus-visible:z-10",
                              i > 0 && "-mt-[118%]",
                            )}
                          >
                            <CardImage card={entry.card} size="normal" />
                            <span className="absolute top-[4.5%] right-[6%] flex gap-1">
                              {entry.quantity > 1 && (
                                <span className="rounded-sm bg-ink/90 px-1.5 py-0.5 text-xs font-semibold tabular-nums shadow-xs">
                                  ×{entry.quantity}
                                </span>
                              )}
                              <span className="grid size-6 place-items-center rounded-sm bg-pass text-ink opacity-0 shadow-xs transition group-hover:opacity-100 group-focus-visible:opacity-100">
                                <MinusIcon className="size-3.5" />
                              </span>
                            </span>
                          </button>
                        </CardHoverPreview>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {deck.maybe.length > 0 && (
            <section>
              <h3 className="ui-label mb-2 flex items-center gap-2 text-maybe">
                <StarIcon className="size-4" /> Maybe
                <span className="tabular-nums">{deck.maybe.length}</span>
              </h3>
              <ul className="panel divide-y divide-border/60 p-1">
                {deck.maybe.map((card) => (
                  <CardHoverPreview key={card.id} card={card}>
                    <li className="flex min-h-11 items-center gap-3 px-2 py-1 text-sm">
                      <button type="button" onClick={() => setInspected(card)} className="min-h-9 flex-1 truncate text-left hover:underline">
                        {card.name}
                      </button>
                      <ManaCost cost={card.manaCost} />
                      <Button size="xs" variant="outline" onClick={() => addCard(card)}>
                        <PlusIcon /> Add
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Remove ${card.name} from maybe`}
                        onClick={() => update((d) => ({ ...d, maybe: d.maybe.filter((m) => m.id !== card.id) }))}
                      >
                        <TrashIcon />
                      </Button>
                    </li>
                  </CardHoverPreview>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <DeckStatsPanel deck={deck} />
        </aside>
      </div>

      <CardSheet card={inspectedEntry || inspectedMaybe ? inspected : null} onClose={() => setInspected(null)}>
        {inspectedEntry ? (
          <>
            {allowsMultipleCopies(inspectedEntry.card.name, inspectedEntry.card.oracleText) && (
              <span className="flex items-center gap-2">
                <Button size="icon-sm" variant="outline" aria-label="Remove one" onClick={() => changeQuantity(inspectedEntry, -1)}>
                  <MinusIcon />
                </Button>
                <span className="min-w-16 text-center tabular-nums">{inspectedEntry.quantity} in deck</span>
                <Button size="icon-sm" variant="outline" aria-label="Add one" onClick={() => addCard(inspectedEntry.card)}>
                  <PlusIcon />
                </Button>
              </span>
            )}
            <Button variant="outline" onClick={() => moveToMaybe(inspectedEntry)}>
              <StarIcon /> Move to maybe
            </Button>
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => changeQuantity(inspectedEntry, -inspectedEntry.quantity)}
            >
              <TrashIcon /> Remove
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => inspected && addCard(inspected)}>
              <PlusIcon /> Add to deck
            </Button>
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => update((d) => ({ ...d, maybe: d.maybe.filter((m) => m.id !== inspected?.id) }))}
            >
              <TrashIcon /> Remove from maybe
            </Button>
          </>
        )}
      </CardSheet>
    </div>
  );
}

function CardRow({
  entry,
  onAdd,
  onRemove,
  onMaybe,
  onInspect,
}: {
  entry: DeckEntry;
  onAdd: () => void;
  onRemove: () => void;
  onMaybe: () => void;
  /** Opens the card big, which is how touch screens read it. */
  onInspect: () => void;
}) {
  const { card, quantity } = entry;
  const multiple = allowsMultipleCopies(card.name, card.oracleText);
  return (
    <CardHoverPreview card={card}>
      <li className="group flex items-center gap-2 min-h-11 rounded-md px-2 py-1 text-sm hover:bg-accent">
        <span className="w-5 text-right text-muted-foreground tabular-nums">{quantity}</span>
        <button
          type="button"
          onClick={onInspect}
          className={cn("min-h-9 flex-1 truncate text-left hover:underline", card.gameChanger && "text-brand")}
          title={card.gameChanger ? "Game Changer" : undefined}
        >
          {card.name}
        </button>
        <ManaCost cost={card.manaCost} className="shrink-0" />
        {/* Shown on hover with a mouse; touch screens (tablets too) always show them. */}
        <span className="flex gap-0.5 opacity-100 transition sm:pointer-fine:opacity-0 sm:pointer-fine:group-hover:opacity-100 sm:pointer-fine:group-focus-within:opacity-100">
          {multiple && (
            <Button size="icon-xs" variant="ghost" aria-label={`Add another ${card.name}`} onClick={onAdd}>
              <PlusIcon />
            </Button>
          )}
          <Button size="icon-xs" variant="ghost" aria-label={`Move ${card.name} to maybe`} onClick={onMaybe}>
            <StarIcon />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label={`Remove ${card.name}`} onClick={onRemove}>
            <MinusIcon />
          </Button>
        </span>
      </li>
    </CardHoverPreview>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn("grid size-9 place-items-center rounded-sm text-muted-foreground hover:text-foreground", active && "bg-secondary text-foreground shadow-sm")}
    >
      {children}
    </button>
  );
}
