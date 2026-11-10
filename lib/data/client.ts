"use client";

import { useQuery } from "@tanstack/react-query";

import type { Card, CommanderSummary } from "@/lib/cards/types";
import type { Combo } from "@/lib/deckbuilder/combos";
import type { CandidatePool, CommanderInsights } from "@/lib/deckbuilder/types";
import type { Bracket } from "@/lib/edhrec/types";
import type { PreconList, PreconSummary } from "@/lib/precons/types";

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function useCommanders() {
  return useQuery({
    queryKey: ["commanders"],
    queryFn: () => getJson<CommanderSummary[]>("/data/commanders.json"),
    staleTime: Infinity,
  });
}

/** Themes and deck counts for a commander, or for a pair when `partner` is given. */
export function useCommanderInsights(name: string | null, partner: string | null = null) {
  return useQuery({
    queryKey: ["commander-insights", name, partner],
    queryFn: () => {
      const params = new URLSearchParams({ commander: name! });
      if (partner) params.set("partner", partner);
      return getJson<CommanderInsights>(`/api/commander-insights?${params}`);
    },
    enabled: Boolean(name),
  });
}

export function fetchCandidatePool(commander: string, partner: string | null, bracket: Bracket, theme: string | null) {
  const params = new URLSearchParams({ commander });
  if (partner) params.set("partner", partner);
  params.set("bracket", String(bracket));
  if (theme) params.set("theme", theme);
  return getJson<CandidatePool>(`/api/candidates?${params}`);
}

export function useCardSearch(query: string, identity: string | null) {
  return useQuery({
    queryKey: ["card-search", query, identity],
    queryFn: () => {
      const params = new URLSearchParams({ q: query });
      if (identity !== null) params.set("identity", identity);
      return getJson<{ cards: Card[] }>(`/api/cards/search?${params}`);
    },
    enabled: query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

export function usePrecons() {
  return useQuery({
    queryKey: ["precons"],
    queryFn: () => getJson<PreconSummary[]>("/data/precons.json"),
    staleTime: Infinity,
  });
}

/** One precon's card list; `id` comes from the precon list, never from user input. */
export function fetchPreconList(id: string) {
  return getJson<PreconList>(`/data/precons/${encodeURIComponent(id)}.json`);
}

export function resolveCardNames(names: string[]) {
  return getJson<{ cards: Record<string, Card>; missing: string[] }>("/api/cards/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
}

/** Commander Spellbook combos in a deck, checked on the server. */
export function useDeckCombos(commanders: string[], cards: string[]) {
  const sorted = [...new Set(cards)].sort();
  return useQuery({
    queryKey: ["combos", commanders, sorted],
    queryFn: () =>
      getJson<{ combos: Combo[] }>("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commanders, cards: sorted }),
      }),
    enabled: sorted.length > 0,
    staleTime: Infinity,
    placeholderData: (previous) => previous,
  });
}
