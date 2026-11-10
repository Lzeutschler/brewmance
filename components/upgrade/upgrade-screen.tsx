"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BracketPicker } from "@/components/build/bracket-picker";
import { ThemeChip } from "@/components/build/commander-setup";
import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardImage } from "@/components/card/card-image";
import { CardSheet } from "@/components/card/card-sheet";
import { ColorIdentity } from "@/components/card/mana";
import { CelebrationCauldron } from "@/components/cauldron";
import { EdhrecLink } from "@/components/edhrec-link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUUpLeftIcon,
  CircleNotchIcon,
  CopyIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SwapIcon,
} from "@/components/icons";
import { DeckSettingsDialog } from "@/components/swipe/deck-settings-dialog";
import { MiniCurve, RoleMeters } from "@/components/swipe/deck-progress";
import { SwipeButtons, SwipeStack, useSwipeKeys } from "@/components/swipe/swipe-controls";
import { CompactWhy, FullScreenMessage, WhyPanel } from "@/components/swipe/swipe-screen";
import { Button } from "@/components/ui/button";
import { cardImageUrl } from "@/lib/cards/image";
import type { Card } from "@/lib/cards/types";
import { fetchCandidatePool } from "@/lib/data/client";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { deckTemplate } from "@/lib/deckbuilder/settings";
import {
  MAX_BUDGET_SHARE,
  canUpgrade,
  explainAdd,
  explainCut,
  nextSwap,
  rankSwaps,
  spentUsd,
  swapsMade,
  type Swap,
  type UpgradeDecision,
  type UpgradePool,
  type UpgradeSession,
} from "@/lib/deckbuilder/upgrade";
import { commandZone, commanderTitle, deckIdentity, mainDeckSize } from "@/lib/decks/command-zone";
import { deckCount, deckStats } from "@/lib/decks/stats";
import type { Deck } from "@/lib/decks/types";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import type { Bracket } from "@/lib/edhrec/types";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

const BACK = { href: "/upgrade", label: "Back to upgrades" };
/** Budgets for all new cards together; a precon upgrade starts at the second step. */
const BUDGET_STEPS: (number | null)[] = [null, 10, 25, 50, 100];
const PRECON_BUDGET = 25;
const SWAP_LABELS = { pick: "SWAP" };

/** The deck's candidate pool, shared with the deckbuilding swipe through the query cache. */
function useUpgradePool(deck: Deck | undefined, bracket: Bracket | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["candidates", deck?.commander.name, deck?.partner?.name ?? null, bracket, deck?.theme],
    queryFn: () => fetchCandidatePool(deck!.commander.name, deck!.partner?.name ?? null, bracket!, deck!.theme),
    enabled: enabled && Boolean(deck),
    staleTime: Infinity,
  });
}

export function UpgradeScreen({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const session = useDeckStore((s) => s.upgrades[deckId]);
  const pool = useUpgradePool(deck, deck?.bracket, hydrated && Boolean(session));

  if (!hydrated) return <FullScreenMessage loading>Loading your decks…</FullScreenMessage>;
  if (!deck) {
    return (
      <FullScreenMessage back={BACK}>
        This deck does not exist on this device.{" "}
        <Link href="/upgrade" className="text-brand underline underline-offset-4">
          Pick a precon or another deck
        </Link>
      </FullScreenMessage>
    );
  }
  if (!session) {
    if (canUpgrade(deck)) return <UpgradeSetup deck={deck} />;
    return (
      <FullScreenMessage back={BACK}>
        <span className="max-w-md">
          {deck.name} has {deckCount(deck.entries)} of {mainDeckSize(deck)} cards. An upgrade trades cards one for one, so finish
          the deck first.
        </span>
        <Button nativeButton={false} render={<Link href={`/build/${deck.id}`} />}>
          Keep building <ArrowRightIcon />
        </Button>
      </FullScreenMessage>
    );
  }
  if (pool.error) {
    return (
      <FullScreenMessage back={BACK}>
        Could not load card suggestions: {pool.error.message}
        <Button variant="outline" onClick={() => pool.refetch()}>
          Try again
        </Button>
      </FullScreenMessage>
    );
  }
  if (!pool.data) return <FullScreenMessage loading>Sizing up {deck.name}…</FullScreenMessage>;
  return <UpgradeBoard deck={deck} session={session} pool={pool.data} />;
}

/** Before the first swap: which bracket the deck should land in and what the new cards may cost. */
function UpgradeSetup({ deck }: { deck: Deck }) {
  const updateDeck = useDeckStore((s) => s.updateDeck);
  const startUpgrade = useDeckStore((s) => s.startUpgrade);
  const [bracket, setBracket] = useState<Bracket>(deck.bracket);
  const [budget, setBudget] = useState<number | null>(deck.precon ? PRECON_BUDGET : null);
  const pool = useUpgradePool(deck, bracket, true);
  const zone = commandZone(deck);
  const size = mainDeckSize(deck);

  const start = () => {
    if (!pool.data) return;
    if (bracket !== deck.bracket) updateDeck(deck.id, (d) => ({ ...d, bracket }));
    startUpgrade(deck.id, pool.data, budget);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <Link href="/upgrade" className="ui-label -my-2 inline-flex min-h-10 items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Upgrades
      </Link>
      <section className="panel grid gap-6 p-4 sm:p-6 md:grid-cols-[260px_1fr]">
        <div className={cn("mx-auto grid gap-3", zone.length > 1 ? "w-72 grid-cols-2 sm:w-96 md:w-full md:grid-cols-1" : "w-40 sm:w-56 md:w-full")}>
          {zone.map((card) => (
            <CardImage key={card.id} card={card} flippable eager />
          ))}
        </div>
        <div className="min-w-0 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl leading-tight font-medium sm:text-4xl">Upgrade {deck.name}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ColorIdentity colors={deckIdentity(deck)} />
              {commanderTitle(deck)}
              {deck.precon ? " · Precon" : ""}
            </p>
            <p className="max-w-2xl pt-1.5 text-[0.9375rem] text-muted-foreground">
              Each card shows a swap: the card that does the least for this deck goes, a better match comes in. Swipe right to
              swap, left to pass. The deck keeps its {size} cards and its land count, and every swap can be undone.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="ui-label text-muted-foreground">Bracket to aim for</h2>
            <BracketPicker value={bracket} onChange={setBracket} />
            <p className="text-sm text-muted-foreground">
              {deck.precon && bracket === 2 ? "Precons are built for bracket 2: staying here keeps the deck fair next to other precons. " : ""}
              {BRACKET_INFO[bracket].description}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="ui-label text-muted-foreground">Budget for the new cards</h2>
            <div role="group" aria-label="Budget for the new cards" className="flex flex-wrap gap-2">
              {BUDGET_STEPS.map((step) => (
                <ThemeChip key={String(step)} active={budget === step} onClick={() => setBudget(step)}>
                  {step === null ? "No limit" : `$${step}`}
                </ThemeChip>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {budget === null
                ? "Any card can show up; its price is on every swap."
                : `The cards you swap in cost at most $${budget} together, and no single card more than $${Math.round(budget * MAX_BUDGET_SHARE)}. Cards without a price count as free.`}
            </p>
          </div>

          <div className="space-y-3 max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-4 max-sm:border-t max-sm:border-border max-sm:bg-card max-sm:px-4 max-sm:py-3 max-sm:shadow-[0_-6px_16px_oklch(0_0_0/45%)]">
            <Button size="lg" className="w-full sm:w-auto" onClick={start} disabled={!pool.data}>
              {pool.isLoading ? <CircleNotchIcon className="animate-spin" /> : <SwapIcon />}
              Find swaps
              <ArrowRightIcon />
            </Button>
            {pool.error && (
              <p className="text-sm text-destructive">
                Could not load card suggestions: {pool.error.message}{" "}
                <button type="button" className="underline underline-offset-4" onClick={() => pool.refetch()}>
                  Try again
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function UpgradeBoard({ deck, session, pool }: { deck: Deck; session: UpgradeSession; pool: UpgradePool }) {
  const router = useRouter();
  const decideUpgrade = useDeckStore((s) => s.decideUpgrade);
  const undoUpgrade = useDeckStore((s) => s.undoUpgrade);
  const finishUpgrade = useDeckStore((s) => s.finishUpgrade);
  const setUpgradeBudget = useDeckStore((s) => s.setUpgradeBudget);
  const [lastDecision, setLastDecision] = useState<SwipeDecision | null>(null);
  const [inspected, setInspected] = useState<Card | null>(null);
  // Looking at the summary while swaps are still on offer.
  const [reviewing, setReviewing] = useState(false);

  const stats = useMemo(() => deckStats(deck), [deck]);
  const template = useMemo(() => deckTemplate(deck), [deck]);
  const swaps = useMemo(() => rankSwaps(deck, pool, session), [deck, pool, session]);
  const swap = swaps[0] ?? null;
  const title = commanderTitle(deck);
  const addReasons = useMemo(() => (swap ? explainAdd(swap, deck, pool, title) : []), [swap, deck, pool, title]);
  const cutReasons = useMemo(() => (swap ? explainCut(swap, deck, pool, title) : []), [swap, deck, pool, title]);
  // With swaps left that only the budget rules out, the summary offers to lift it.
  const overBudget = useMemo(
    () => !swap && session.budgetUsd !== null && nextSwap(deck, pool, { ...session, budgetUsd: null }) !== null,
    [swap, deck, pool, session],
  );
  const made = swapsMade(session);
  const spent = spentUsd(session);
  const swiping = swap !== null && !reviewing;

  // Warm the image cache for the cards most likely to come next.
  useEffect(() => {
    for (const next of swaps.slice(0, 4)) {
      if (next.in.image) new Image().src = cardImageUrl(next.in.image, "large");
    }
  }, [swaps]);

  const decide = (decision: UpgradeDecision) => {
    if (!swap || reviewing) return;
    setLastDecision(decision === "swap" ? "pick" : decision === "keep" ? null : decision);
    decideUpgrade(deck.id, swap, decision);
  };
  const undo = () => {
    setLastDecision(null);
    undoUpgrade(deck.id);
  };
  const finish = () => {
    finishUpgrade(deck.id);
    router.push(`/decks/${deck.id}`);
  };

  useSwipeKeys((decision) => decide(decision === "pick" ? "swap" : decision), undo);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || e.metaKey || e.ctrlKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return;
      decide("keep");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-3 lg:grid-cols-[280px_1fr_300px] lg:py-6">
      {/* Deck and upgrade progress */}
      <aside className="panel order-2 space-y-5 p-5 lg:order-1">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0">
            {commandZone(deck).map((c, i) => (
              <div key={c.id} className={cn("w-14", i > 0 && "-ml-8 rotate-6")}>
                <CardImage card={c} size="small" />
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-lg leading-tight font-medium">{deck.name}</div>
            <div className="text-xs text-muted-foreground">
              Bracket {deck.bracket} · {BRACKET_INFO[deck.bracket].name}
              {deck.settings.preferences.maxPriceUsd !== null ? ` · up to $${deck.settings.preferences.maxPriceUsd} per card` : ""}
            </div>
          </div>
        </div>
        <UpgradeCounter swaps={made.length} spent={spent} budget={session.budgetUsd} />
        <RoleMeters stats={stats} template={template} />
        <div>
          <div className="ui-label mb-1.5 text-muted-foreground">
            Mana curve <span className="font-normal tracking-normal normal-case">(dashed = target)</span>
          </div>
          <MiniCurve stats={stats} template={template} />
        </div>
        <div className="flex flex-col gap-2">
          <DeckSettingsDialog deck={deck} />
          {swiping && (
            <Button variant="outline" onClick={() => setReviewing(true)}>
              Finish upgrade
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {pool.source === "edhrec" ? (
            <>
              Swaps from{" "}
              <EdhrecLink href={edhrecCommanderUrl(commandZone(deck), deck.bracket, deck.theme)}>
                {pool.deckCount.toLocaleString()} EDHREC decks
              </EdhrecLink>
              .
            </>
          ) : (
            "There is little deck data on this commander, so swaps use card popularity and themes."
          )}
        </p>
      </aside>

      {/* The swap */}
      {/* min-w-0: the truncated lines of the card to cut must not widen the column on a phone. */}
      <section className="order-1 flex min-w-0 flex-col items-center gap-3 select-none lg:order-2 lg:gap-4">
        <div className="flex w-full max-w-md items-center justify-between gap-2">
          <div className="ui-label flex min-w-0 items-center gap-2 whitespace-nowrap text-muted-foreground">
            <SwapIcon className="size-4 shrink-0" />
            {session.history.length === 0 && swiping ? (
              <span className="lg:hidden">Swipe → swap · ← pass · ↑ maybe</span>
            ) : (
              <span className="lg:hidden">
                <span className="text-foreground tabular-nums">{made.length}</span> {made.length === 1 ? "swap" : "swaps"} ·{" "}
                <span className="tabular-nums">${spent.toFixed(2)}</span>
                {session.budgetUsd !== null && <span className="tabular-nums"> of ${session.budgetUsd}</span>}
              </span>
            )}
            <span className="max-lg:hidden">{swiping ? `Swap ${made.length + 1}` : "Upgrade"}</span>
          </div>
          <div className="flex shrink-0 items-center lg:hidden">
            {swiping && (
              <Button variant="ghost" size="sm" onClick={() => setReviewing(true)}>
                Finish
              </Button>
            )}
            <DeckSettingsDialog
              deck={deck}
              trigger={
                <Button variant="ghost" size="sm">
                  <SlidersHorizontalIcon /> Settings
                </Button>
              }
            />
          </div>
        </div>

        {swap && swiping ? (
          <>
            <CutStrip swap={swap} reason={cutReasons[0]} onKeep={() => decide("keep")} onInspect={() => setInspected(swap.out)} />
            <SwipeStack
              card={swap.in}
              cardKey={swap.in.id}
              lastDecision={lastDecision}
              onDecision={(decision) => decide(decision === "pick" ? "swap" : decision)}
              labels={SWAP_LABELS}
              // Leaves room for the card to cut above and the reasons below the buttons.
              className="max-lg:w-[min(400px,84vw,calc((100dvh-22rem)*0.7176))] lg:w-[min(400px,calc((100dvh-22rem)*0.7176))]"
            />
            <SwipeButtons
              onDecision={(decision) => decide(decision === "pick" ? "swap" : decision)}
              onUndo={undo}
              canUndo={session.history.length > 0}
              pickLabel="Swap"
            />
            <p className="hidden text-xs text-muted-foreground lg:block">Drag the card or use ← ↑ → · K to keep your card · Z to undo</p>
            <CompactWhy candidate={swap.in} reasons={addReasons} />
          </>
        ) : (
          <UpgradeSummary
            deck={deck}
            session={session}
            swapsLeft={swap !== null}
            overBudget={overBudget}
            onBack={() => setReviewing(false)}
            onLiftBudget={() => setUpgradeBudget(deck.id, null)}
            onUndo={undo}
            onFinish={finish}
          />
        )}
      </section>

      {/* Why this swap */}
      <aside className="order-3 space-y-5">
        {swap && swiping && (
          <>
            <WhyPanel candidate={swap.in} reasons={addReasons} deckCount={pool.deckCount} />
            <div className="panel hidden space-y-3 p-5 lg:block">
              <div className="ui-label text-pass">Why {swap.out.name} goes</div>
              <ul className="space-y-1.5 text-sm">
                {cutReasons.slice(0, 3).map((text) => (
                  <li key={text} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-pass" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* The summary lists every swap itself. */}
        <div className={cn("panel space-y-3 p-5", !swiping && "hidden")}>
          <div className="flex items-center justify-between text-sm">
            <span className="ui-label text-muted-foreground">Swaps so far</span>
            <Link href={`/decks/${deck.id}`} className="-my-2 inline-flex min-h-10 items-center text-xs text-muted-foreground hover:text-foreground">
              Open deck →
            </Link>
          </div>
          {made.length === 0 ? (
            <p className="text-xs text-muted-foreground">Swipe right on a swap you like.</p>
          ) : (
            <SwapList swaps={made.slice(-8).reverse()} onInspect={setInspected} />
          )}
        </div>
      </aside>

      <CardSheet card={inspected} onClose={() => setInspected(null)} />
    </div>
  );
}

/** The card the swap takes out of the deck, above the card that comes in. */
function CutStrip({ swap, reason, onKeep, onInspect }: { swap: Swap; reason?: string; onKeep: () => void; onInspect: () => void }) {
  return (
    <div className="panel flex w-full max-w-md items-center gap-3 p-2 pr-3" data-testid="cut-strip">
      <CardHoverPreview card={swap.out}>
        <button type="button" onClick={onInspect} aria-label={`Look at ${swap.out.name}`} className="w-11 shrink-0 rounded-[4.75%] sm:w-12">
          <CardImage card={swap.out} size="small" className="shadow-sm" />
        </button>
      </CardHoverPreview>
      <div className="min-w-0 flex-1">
        <div className="ui-label text-xs text-pass">Swap out</div>
        <div className="truncate font-heading text-lg leading-tight font-medium" data-testid="cut-name">
          {swap.out.name}
        </div>
        {reason && <p className="truncate text-xs text-muted-foreground">{reason}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={onKeep} title="Keep this card and cut another (K)">
        <ShieldCheckIcon /> Keep
      </Button>
    </div>
  );
}

function UpgradeCounter({ swaps, spent, budget }: { swaps: number; spent: number; budget: number | null }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="numeral text-5xl" data-testid="swap-count">
            {swaps}
          </div>
          <div className="ui-label mt-1 text-muted-foreground">{swaps === 1 ? "swap made" : "swaps made"}</div>
        </div>
        <div className="text-right text-xs leading-relaxed text-muted-foreground tabular-nums">
          <div>
            New cards <span className="text-foreground">${spent.toFixed(2)}</span>
          </div>
          {budget !== null && <div>of ${budget} budget</div>}
        </div>
      </div>
      {budget !== null && (
        <div className="h-2 overflow-hidden rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)]">
          <div
            className="h-full origin-left bg-brand transition-transform duration-500"
            style={{ transform: `scaleX(${budget > 0 ? Math.min(1, spent / budget) : 1})` }}
          />
        </div>
      )}
    </div>
  );
}

function SwapList({ swaps, onInspect }: { swaps: { out: Card; in: Card }[]; onInspect: (card: Card) => void }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {swaps.map(({ out, in: added }) => (
        <li key={`${out.id}-${added.id}`} className="flex flex-col rounded-md px-2 py-1 hover:bg-accent">
          <CardHoverPreview card={added}>
            <button type="button" onClick={() => onInspect(added)} className="flex min-h-7 items-center justify-between gap-2 text-left hover:underline">
              <span className="truncate">{added.name}</span>
              {added.priceUsd !== null && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">${added.priceUsd.toFixed(2)}</span>}
            </button>
          </CardHoverPreview>
          <CardHoverPreview card={out}>
            <button type="button" onClick={() => onInspect(out)} className="truncate text-left text-xs text-muted-foreground hover:underline">
              for <span className="line-through decoration-pass/70">{out.name}</span>
            </button>
          </CardHoverPreview>
        </li>
      ))}
    </ul>
  );
}

/** The end of an upgrade, or a look at it in between: what changed and what the new cards cost. */
function UpgradeSummary({
  deck,
  session,
  swapsLeft,
  overBudget,
  onBack,
  onLiftBudget,
  onUndo,
  onFinish,
}: {
  deck: Deck;
  session: UpgradeSession;
  swapsLeft: boolean;
  overBudget: boolean;
  onBack: () => void;
  onLiftBudget: () => void;
  onUndo: () => void;
  onFinish: () => void;
}) {
  const [inspected, setInspected] = useState<Card | null>(null);
  const made = swapsMade(session);
  const spent = spentUsd(session);

  const copyList = async () => {
    await navigator.clipboard.writeText(made.map((h) => `1 ${h.in.name}`).join("\n"));
    toast.success("Shopping list copied");
  };

  return (
    <div className="panel flex w-full max-w-md flex-col items-center gap-4 p-6 text-center sm:p-8" data-testid="upgrade-summary">
      {made.length > 0 && <CelebrationCauldron className="-mt-2 text-[4.5px]" />}
      <h2 className="text-2xl font-medium">{made.length > 0 ? "A better match" : swapsLeft ? "No swaps yet" : "Nothing to swap"}</h2>
      <p className="text-muted-foreground">
        {made.length > 0
          ? `${made.length} ${made.length === 1 ? "swap" : "swaps"}, about $${spent.toFixed(2)} of new cards. ${deck.name} kept its ${mainDeckSize(deck)} cards and its land count.`
          : swapsLeft
            ? "You have not swapped a card yet."
            : overBudget
              ? "Every swap worth making costs more than your budget."
              : `Nothing on offer clearly beats what ${deck.name} already plays.`}
        {made.length > 0 && !swapsLeft && (overBudget ? " More swaps are on offer above your budget." : " That was every swap worth making.")}
      </p>

      {made.length > 0 && (
        <div className="w-full text-left">
          <SwapList swaps={made} onInspect={setInspected} />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {swapsLeft && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeftIcon /> Keep swiping
          </Button>
        )}
        {overBudget && (
          <Button variant="outline" onClick={onLiftBudget}>
            Go on without a budget
          </Button>
        )}
        {!swapsLeft && session.history.length > 0 && (
          <Button variant="outline" onClick={onUndo}>
            <ArrowUUpLeftIcon /> Undo
          </Button>
        )}
        {made.length > 0 && (
          <Button variant="outline" onClick={copyList}>
            <CopyIcon /> Copy shopping list
          </Button>
        )}
        <Button onClick={onFinish}>{made.length > 0 ? "Finish & open deck" : "Open deck"}</Button>
      </div>
      <CardSheet card={inspected} onClose={() => setInspected(null)} />
    </div>
  );
}
