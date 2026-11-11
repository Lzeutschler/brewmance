import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { cardImageUrl } from "@/lib/cards/image";
import type { SluggedPrecon } from "@/lib/precons/slug";

export type PreconTileData = Pick<SluggedPrecon, "slug" | "name" | "releaseDate" | "commanders" | "colorIdentity" | "image">;

/**
 * A precon as a framed art crop with a name plate, linking to its page. The markup of the tiles in the upgrade
 * picker (components/upgrade/precon-picker.tsx), as a link instead of a button, and the name may wrap to two lines.
 * No hooks, so it renders on the server and inside client lists alike.
 */
export function PreconTile({ precon }: { precon: PreconTileData }) {
  const colors = precon.colorIdentity.length ? precon.colorIdentity : ["C"];
  return (
    <Link
      href={`/precons/${precon.slug}`}
      className="panel flex flex-col overflow-hidden p-2 text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70 motion-reduce:hover:translate-y-0"
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
      </div>
      <div className="mt-2 flex h-1 gap-px overflow-hidden rounded-xs" aria-hidden="true">
        {colors.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: `var(--mana-${color.toLowerCase()})` }} />
        ))}
      </div>
      <div className="space-y-1 px-2 pt-2 pb-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 text-lg leading-tight font-medium">{precon.name}</h3>
          <ColorIdentity colors={precon.colorIdentity} className="max-sm:hidden" />
        </div>
        <p className="truncate text-xs text-muted-foreground">{precon.commanders.join(" & ")}</p>
      </div>
    </Link>
  );
}

/** Tiles in the grid the upgrade picker uses: two columns on a phone. */
export function PreconTileGrid({ precons }: { precons: readonly PreconTileData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {precons.map((precon) => (
        <PreconTile key={precon.slug} precon={precon} />
      ))}
    </div>
  );
}
