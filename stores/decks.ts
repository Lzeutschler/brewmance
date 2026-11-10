"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Card } from "@/lib/cards/types";
import {
  decide,
  finish,
  refreshSession,
  skipToLands,
  startSession,
  undo,
  type SwipeDecision,
  type SwipeSession,
} from "@/lib/deckbuilder/session";
import { DEFAULT_PREFERENCES, type DeckSettings, type SwipePreferences } from "@/lib/deckbuilder/settings";
import type { DeckTemplate } from "@/lib/deckbuilder/template";
import type { CandidatePool } from "@/lib/deckbuilder/types";
import {
  decideSwap,
  startUpgrade,
  undoSwap,
  type Swap,
  type UpgradeDecision,
  type UpgradePool,
  type UpgradeSession,
} from "@/lib/deckbuilder/upgrade";
import { DECK_STORE_VERSION, migrateDeckStore } from "@/lib/decks/migrate";
import type { Bracket } from "@/lib/edhrec/types";
import { commanderTitle } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";

interface DeckStore {
  decks: Record<string, Deck>;
  /** In-progress swipe sessions, keyed by deck id. */
  sessions: Record<string, SwipeSession>;
  /** Upgrades in progress, keyed by deck id. */
  upgrades: Record<string, UpgradeSession>;
  /** Oracle ids of cards swiped left, per commander oracle id, for "hide cards I passed before". */
  passedByCommander: Record<string, string[]>;
  /** Preferences of the deck changed last; new decks start with them. */
  lastPreferences: SwipePreferences;

  createDeck(input: {
    commander: Card;
    partner?: Card;
    bracket: Bracket;
    theme: string | null;
    name?: string;
    entries?: Deck["entries"];
    maybe?: Card[];
    settings?: DeckSettings;
    recommendation?: DeckTemplate;
    precon?: Deck["precon"];
  }): string;
  updateDeck(id: string, update: (deck: Deck) => Deck): void;
  deleteDeck(id: string): void;
  /** Starts swiping `deckId` with a freshly loaded candidate pool. */
  startSession(deckId: string, pool: CandidatePool, seed: number): void;
  /** Changes a deck's swipe settings; the running session picks them up with the next card. */
  updateSettings(deckId: string, settings: DeckSettings): void;
  swipe(deckId: string, cardId: string, decision: SwipeDecision): void;
  undoSwipe(deckId: string): void;
  skipToLands(deckId: string): void;
  /** Fills the deck with basics and ends its swipe session. */
  finishSwipe(deckId: string): void;
  /** Starts trading the deck's weakest cards, at most `budgetUsd` for the new ones together. */
  startUpgrade(deckId: string, pool: UpgradePool, budgetUsd: number | null): void;
  decideUpgrade(deckId: string, swap: Pick<Swap, "out" | "in">, decision: UpgradeDecision): void;
  undoUpgrade(deckId: string): void;
  /** Changes what the new cards of a running upgrade may cost together; null lifts the limit. */
  setUpgradeBudget(deckId: string, budgetUsd: number | null): void;
  /** Ends the upgrade; the swaps made stay in the deck. */
  finishUpgrade(deckId: string): void;
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks: {},
      sessions: {},
      upgrades: {},
      passedByCommander: {},
      lastPreferences: DEFAULT_PREFERENCES,

      createDeck({ commander, partner, bracket, theme, name, entries = [], maybe = [], settings, recommendation, precon }) {
        const id = crypto.randomUUID();
        const now = Date.now();
        const deck: Deck = {
          id,
          name: name ?? commanderTitle({ commander, partner }),
          commander,
          ...(partner && { partner }),
          bracket,
          theme,
          entries,
          maybe,
          settings: settings ?? { overrides: {}, preferences: get().lastPreferences },
          recommendation,
          ...(precon && { precon }),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          decks: { ...s.decks, [id]: deck },
          lastPreferences: settings ? settings.preferences : s.lastPreferences,
        }));
        return id;
      },

      updateDeck(id, update) {
        const deck = get().decks[id];
        if (!deck) return;
        set((s) => ({ decks: { ...s.decks, [id]: { ...update(deck), updatedAt: Date.now() } } }));
      },

      deleteDeck(id) {
        set((s) => {
          const { [id]: _deck, ...decks } = s.decks;
          const { [id]: _session, ...sessions } = s.sessions;
          const { [id]: _upgrade, ...upgrades } = s.upgrades;
          return { decks, sessions, upgrades };
        });
      },

      startSession(deckId, pool, seed) {
        const { decks, passedByCommander } = get();
        const deck = decks[deckId];
        if (!deck) return;
        const next = startSession(deck, pool, seed, passedByCommander[deck.commander.oracleId] ?? []);
        set((s) => ({
          decks: { ...s.decks, [deckId]: next.deck },
          sessions: { ...s.sessions, [deckId]: next.session },
        }));
      },

      updateSettings(deckId, settings) {
        const { decks, sessions } = get();
        const deck = decks[deckId];
        if (!deck) return;
        const nextDeck = { ...deck, settings, updatedAt: Date.now() };
        const session = sessions[deckId];
        set((s) => ({
          decks: { ...s.decks, [deckId]: nextDeck },
          sessions: session ? { ...s.sessions, [deckId]: refreshSession(session, nextDeck) } : s.sessions,
          lastPreferences: settings.preferences,
        }));
      },

      swipe(deckId, cardId, decision) {
        const { decks, sessions } = get();
        const deck = decks[deckId];
        const session = sessions[deckId];
        const card = session?.pool.find((c) => c.id === cardId);
        if (!deck || !session || !card) return;
        const next = decide(session, deck, card, decision);
        set((s) => ({
          decks: { ...s.decks, [deckId]: next.deck },
          sessions: { ...s.sessions, [deckId]: next.session },
          passedByCommander:
            decision === "pass" ? togglePassed(s.passedByCommander, deck.commander.oracleId, card.oracleId, true) : s.passedByCommander,
        }));
      },

      undoSwipe(deckId) {
        const { decks, sessions } = get();
        const deck = decks[deckId];
        const session = sessions[deckId];
        if (!deck || !session) return;
        const last = session.history.at(-1);
        const lastCard = last?.decision === "pass" ? session.pool.find((c) => c.id === last.cardId) : undefined;
        const next = undo(session, deck);
        set((s) => ({
          decks: { ...s.decks, [deckId]: next.deck },
          sessions: { ...s.sessions, [deckId]: next.session },
          passedByCommander: lastCard
            ? togglePassed(s.passedByCommander, deck.commander.oracleId, lastCard.oracleId, false)
            : s.passedByCommander,
        }));
      },

      skipToLands(deckId) {
        const { decks, sessions } = get();
        if (!decks[deckId] || !sessions[deckId]) return;
        set((s) => ({ sessions: { ...s.sessions, [deckId]: skipToLands(sessions[deckId], decks[deckId]) } }));
      },

      finishSwipe(deckId) {
        const { decks, sessions } = get();
        if (!decks[deckId] || !sessions[deckId]) return;
        const deck = finish(sessions[deckId], decks[deckId]);
        set((s) => {
          const { [deckId]: _session, ...rest } = s.sessions;
          return { decks: { ...s.decks, [deckId]: deck }, sessions: rest };
        });
      },

      startUpgrade(deckId, pool, budgetUsd) {
        const deck = get().decks[deckId];
        if (!deck) return;
        const next = startUpgrade(deck, pool, budgetUsd);
        set((s) => ({ decks: { ...s.decks, [deckId]: next.deck }, upgrades: { ...s.upgrades, [deckId]: next.session } }));
      },

      decideUpgrade(deckId, swap, decision) {
        const { decks, upgrades } = get();
        if (!decks[deckId] || !upgrades[deckId]) return;
        const next = decideSwap(upgrades[deckId], decks[deckId], swap, decision);
        set((s) => ({ decks: { ...s.decks, [deckId]: next.deck }, upgrades: { ...s.upgrades, [deckId]: next.session } }));
      },

      undoUpgrade(deckId) {
        const { decks, upgrades } = get();
        if (!decks[deckId] || !upgrades[deckId]) return;
        const next = undoSwap(upgrades[deckId], decks[deckId]);
        set((s) => ({ decks: { ...s.decks, [deckId]: next.deck }, upgrades: { ...s.upgrades, [deckId]: next.session } }));
      },

      setUpgradeBudget(deckId, budgetUsd) {
        const session = get().upgrades[deckId];
        if (session) set((s) => ({ upgrades: { ...s.upgrades, [deckId]: { ...session, budgetUsd } } }));
      },

      finishUpgrade(deckId) {
        set((s) => {
          const { [deckId]: _upgrade, ...upgrades } = s.upgrades;
          return { upgrades };
        });
      },
    }),
    {
      name: "commander-tinder",
      version: DECK_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => migrateDeckStore(persisted, version) as DeckStore,
    },
  ),
);

/** Most cards remembered as passed per commander; older passes drop out first. */
const MAX_PASSED = 500;

function togglePassed(
  passed: Record<string, string[]>,
  commanderId: string,
  cardId: string,
  add: boolean,
): Record<string, string[]> {
  const rest = (passed[commanderId] ?? []).filter((id) => id !== cardId);
  return { ...passed, [commanderId]: add ? [...rest, cardId].slice(-MAX_PASSED) : rest };
}

/** False during SSR and until the persisted decks have been read from localStorage. */
export function useDecksHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDeckStore.persist.onFinishHydration(onChange),
    () => useDeckStore.persist.hasHydrated(),
    () => false,
  );
}
