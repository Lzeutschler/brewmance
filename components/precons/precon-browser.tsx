"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { ManaSymbol } from "@/components/card/mana";
import { EmptyCauldron } from "@/components/cauldron";
import { MagnifyingGlassIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLOR_NAMES, COLORS, sortColors } from "@/lib/cards/colors";
import { nameKey } from "@/lib/cards/names";
import type { Color } from "@/lib/cards/types";
import { colorWords } from "@/lib/precons/page-text";
import { identityKey } from "@/lib/precons/slug";
import { cn } from "@/lib/utils";

import { PreconTileGrid, type PreconTileData } from "./precon-tile";

export type BrowserPrecon = PreconTileData & { set: string };

/** Fired after the color filter rewrote the URL, so the list reads it again. */
const COLORS_EVENT = "precons:colors";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(COLORS_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(COLORS_EVENT, onChange);
  };
}

const currentSearch = () => window.location.search;
// The server renders every precon; the filter from the URL applies once the page has hydrated.
const serverSearch = () => "";

interface ColorFilter {
  colors: Color[];
  /** True for `?identity=`: only decks with exactly these colors (`c` = colorless), as the color guide links. */
  exact: boolean;
}

/** `?colors=wu` → decks that play white and blue; `?identity=wu` → only white-blue decks. Unknown letters are ignored. */
function filterFrom(search: string): ColorFilter {
  const params = new URLSearchParams(search);
  const identity = params.get("identity");
  if (identity !== null) return { colors: sortColors(identity.toUpperCase().split("")), exact: true };
  return { colors: sortColors((params.get("colors") ?? "").toUpperCase().split("")), exact: false };
}

/** Writes the color filter into the URL without a navigation, so the filtered list can be shared or bookmarked. */
function writeColors(colors: readonly Color[]) {
  const url = new URL(window.location.href);
  const key = identityKey(colors).toLowerCase();
  url.searchParams.delete("identity");
  if (key) url.searchParams.set("colors", key);
  else url.searchParams.delete("colors");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(COLORS_EVENT));
}

/**
 * Reads the URL again after a client-side navigation (a link to /precons while a filter is set), which fires no
 * popstate. Kept apart from the list so the tiles stay in the prerendered HTML.
 */
function SearchParamsSync() {
  const params = useSearchParams();
  useEffect(() => {
    window.dispatchEvent(new Event(COLORS_EVENT));
  }, [params]);
  return null;
}

function searchText(text: string): string {
  return nameKey(text).replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Every precon by release year, with a color filter (a deck matches when its colors include all picked ones) and a
 * search over deck and commander names. All tiles are in the server HTML; the filters only hide some.
 */
export function PreconBrowser({ precons }: { precons: BrowserPrecon[] }) {
  const search = useSyncExternalStore(subscribe, currentSearch, serverSearch);
  const { colors, exact } = useMemo(() => filterFrom(search), [search]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const tokens = searchText(deferredQuery).split(" ").filter(Boolean);
    return precons.filter((p) => {
      if (exact ? identityKey(p.colorIdentity) !== identityKey(colors) : !colors.every((c) => p.colorIdentity.includes(c)))
        return false;
      if (!tokens.length) return true;
      const haystack = searchText(`${p.name} ${p.commanders.join(" ")} ${p.set} ${p.releaseDate.slice(0, 4)}`);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [precons, colors, exact, deferredQuery]);

  const one = results.length === 1;

  // Newest first, so years come out in order.
  const years = useMemo(() => {
    const byYear: { year: string; precons: BrowserPrecon[] }[] = [];
    for (const precon of results) {
      const year = precon.releaseDate.slice(0, 4);
      const last = byYear[byYear.length - 1];
      if (last?.year === year) last.precons.push(precon);
      else byYear.push({ year, precons: [precon] });
    }
    return byYear;
  }, [results]);

  const toggle = (color: Color) =>
    writeColors(colors.includes(color) ? colors.filter((c) => c !== color) : [...colors, color]);

  const clear = () => {
    setQuery("");
    writeColors([]);
  };

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <SearchParamsSync />
      </Suspense>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by deck or commander…"
              aria-label="Search by deck or commander"
              className="h-11 pl-9"
            />
          </div>
          <div className="flex items-center gap-1" role="group" aria-label="Colors the deck plays">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggle(color)}
                aria-pressed={colors.includes(color)}
                aria-label={COLOR_NAMES[color]}
                className={cn(
                  "grid size-10 place-items-center rounded-md border border-transparent opacity-45 grayscale-[60%] transition hover:bg-accent hover:opacity-90",
                  colors.includes(color) && "border-brand bg-brand/12 opacity-100 grayscale-0",
                )}
              >
                <ManaSymbol symbol={color} className="size-6" />
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {results.length} precon{one ? "" : "s"}
          {exact
            ? colors.length
              ? ` that ${one ? "plays" : "play"} only ${colorWords(colors)}`
              : ` that ${one ? "is" : "are"} colorless`
            : colors.length > 0 && ` that ${one ? "plays" : "play"} ${colorWords(colors)}`}
          , newest first
        </p>
      </div>

      {years.map(({ year, precons: inYear }) => (
        <section key={year} className="space-y-4" aria-labelledby={`year-${year}`}>
          <h2 id={`year-${year}`} className="flex items-baseline gap-3 text-2xl font-medium">
            {year}{" "}
            <span className="ui-label text-muted-foreground tabular-nums">
              {inYear.length} deck{inYear.length === 1 ? "" : "s"}
            </span>
          </h2>
          <PreconTileGrid precons={inYear} />
        </section>
      ))}

      {results.length === 0 && (
        <EmptyCauldron
          title="No precon matches"
          description="Try fewer colors or a shorter search."
          actions={
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}
