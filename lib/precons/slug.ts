import { sortColors } from "@/lib/cards/colors";
import { nameKey } from "@/lib/cards/names";

import type { PreconSummary } from "./types";

/** Precons released on or after this date are indexed by search engines and listed in the sitemap. */
export const INDEX_FROM = "2025-01-01";

/** A precon summary with its page slug, e.g. "virtue-and-valor-woc" for /precons/virtue-and-valor-woc. */
export type SluggedPrecon = PreconSummary & { slug: string };

/** Lower-case words joined by single dashes: "Virtue & Valor" → "virtue-and-valor". */
function slugify(text: string): string {
  return nameKey(text)
    .replace(/&/g, " and ")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The page slug of a precon: its name plus the set code, as names repeat across sets. */
export function preconSlug(precon: Pick<PreconSummary, "name" | "set">): string {
  return [slugify(precon.name), slugify(precon.set)].filter(Boolean).join("-");
}

/** True for precons whose pages search engines may index (the rest render with noindex). */
export function isIndexedPrecon(precon: Pick<PreconSummary, "releaseDate">): boolean {
  return precon.releaseDate >= INDEX_FROM;
}

/**
 * A color identity as sorted WUBRG letters, "" for colorless: ["U", "W"] → "WU". The key of
 * `preconCountsByIdentity`; lower-cased it is the `?colors=` value of /precons.
 */
export function identityKey(colors: readonly string[]): string {
  return sortColors(colors).join("");
}

/** Slugs are lower-case letters and digits in dash-separated words. */
export function isUrlSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Every precon with a unique slug, in the given order. When two precons share a name and set, the first
 * keeps the name slug and later ones fall back to their id ("GuidedByNature_C14" → "guidedbynature-c14").
 */
export function withSlugs<T extends Pick<PreconSummary, "id" | "name" | "set">>(precons: readonly T[]): (T & { slug: string })[] {
  const taken = new Set<string>();
  return precons.map((precon) => {
    let slug = preconSlug(precon);
    if (!slug || taken.has(slug)) slug = slugify(precon.id);
    const base = slug;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
    taken.add(slug);
    return { ...precon, slug };
  });
}

/** Precons keyed by their unique slug. */
export function preconSlugMap<T extends Pick<PreconSummary, "id" | "name" | "set">>(precons: readonly T[]): Map<string, T & { slug: string }> {
  return new Map(withSlugs(precons).map((precon) => [precon.slug, precon]));
}
