"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

import { ColorIdentity } from "@/components/card/mana";
import { CircleNotchIcon, MagnifyingGlassIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cardImageUrl } from "@/lib/cards/image";
import { nameKey } from "@/lib/cards/names";
import { fetchPreconList, resolveCardNames, usePrecons } from "@/lib/data/client";
import { preconCardNames, preconDeck } from "@/lib/precons/deck";
import type { PreconSummary } from "@/lib/precons/types";
import { cn } from "@/lib/utils";
import { useDeckStore } from "@/stores/decks";

const PAGE_SIZE = 12;

function searchText(text: string): string {
  return nameKey(text).replace(/[^a-z0-9]+/g, " ").trim();
}

/** Every preconstructed Commander deck, newest first. Picking one saves it as a deck and opens its upgrade. */
export function PreconPicker() {
  const router = useRouter();
  const { data: precons, isLoading, error } = usePrecons();
  const createDeck = useDeckStore((s) => s.createDeck);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [opening, setOpening] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const tokens = searchText(deferredQuery).split(" ").filter(Boolean);
    return (precons ?? []).filter((p) => {
      const haystack = searchText(`${p.name} ${p.commanders.join(" ")} ${p.set} ${p.releaseDate.slice(0, 4)}`);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [precons, deferredQuery]);

  const open = async (precon: PreconSummary) => {
    if (opening) return;
    // A copy of this precon that was never touched opens again instead of piling up duplicates.
    const untouched = Object.values(useDeckStore.getState().decks).find((d) => d.precon?.id === precon.id && d.updatedAt === d.createdAt);
    if (untouched) {
      router.push(`/upgrade/${untouched.id}`);
      return;
    }
    setOpening(precon.id);
    try {
      const list = await fetchPreconList(precon.id);
      const { cards } = await resolveCardNames(preconCardNames(list));
      const deck = preconDeck(list, cards);
      if (!deck) throw new Error(`Could not find the commander of ${precon.name}`);
      const { missing, ...input } = deck;
      const id = createDeck(input);
      if (missing.length) toast.warning(`Left out ${missing.length} card(s) that are not Commander-legal: ${missing.slice(0, 3).join(", ")}`);
      router.push(`/upgrade/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load this precon");
      setOpening(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          placeholder="Search precons by name, commander or year…"
          aria-label="Search precons"
          className="h-11 pl-9"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {precons ? `${results.length.toLocaleString()} precons, newest first` : error ? "" : "Loading precons…"}
      </p>
      {error && <p className="text-sm text-destructive">Could not load the precons: {error.message}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        {results.slice(0, limit).map((precon) => (
          <PreconTile key={precon.id} precon={precon} busy={opening === precon.id} disabled={opening !== null} onOpen={() => open(precon)} />
        ))}
      </div>
      {precons && results.length === 0 && <p className="text-sm text-muted-foreground">No precon matches that search.</p>}

      {results.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE * 2)}>
            Show more precons
          </Button>
        </div>
      )}
    </div>
  );
}

/** A precon as a framed art crop with a name plate, like the tiles under "My decks". */
function PreconTile({ precon, busy, disabled, onOpen }: { precon: PreconSummary; busy: boolean; disabled: boolean; onOpen: () => void }) {
  const colors = precon.colorIdentity.length ? precon.colorIdentity : ["C"];
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-busy={busy}
      className={cn(
        "panel flex flex-col overflow-hidden p-2 text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70 disabled:pointer-events-none",
        disabled && !busy && "opacity-60",
      )}
    >
      <div className="relative h-24 overflow-hidden rounded-md bg-muted sm:h-28">
        {precon.image && (
          // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
          <img
            src={cardImageUrl(precon.image, "art_crop")}
            alt=""
            loading="lazy"
            className="size-full object-cover object-[center_25%]"
          />
        )}
        <span className="numeral absolute top-1.5 left-1.5 rounded-sm bg-ink/85 px-1.5 py-0.5 text-xs">{precon.releaseDate.slice(0, 4)}</span>
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-ink/70">
            <CircleNotchIcon className="size-6 animate-spin text-brand" />
          </span>
        )}
      </div>
      <div className="mt-2 flex h-1 gap-px overflow-hidden rounded-xs" aria-hidden="true">
        {colors.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: `var(--mana-${color.toLowerCase()})` }} />
        ))}
      </div>
      <div className="space-y-1 px-2 pt-2 pb-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-lg leading-tight font-medium">{precon.name}</h3>
          <ColorIdentity colors={precon.colorIdentity} className="max-sm:hidden" />
        </div>
        <p className="truncate text-xs text-muted-foreground">{precon.commanders.join(" & ")}</p>
      </div>
    </button>
  );
}
