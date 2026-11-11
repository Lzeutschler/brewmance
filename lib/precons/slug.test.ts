import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { identityKey, INDEX_FROM, isIndexedPrecon, isUrlSafeSlug, preconSlug, preconSlugMap, withSlugs } from "./slug";
import type { PreconSummary } from "./types";

describe("preconSlug", () => {
  it("joins the lower-cased name and set code", () => {
    expect(preconSlug({ name: "Virtue and Valor", set: "WOC" })).toBe("virtue-and-valor-woc");
  });

  it("spells out &, drops apostrophes and folds accents", () => {
    expect(preconSlug({ name: "Blood & Thunder", set: "C13" })).toBe("blood-and-thunder-c13");
    expect(preconSlug({ name: "Grand Larceny’s Heist", set: "OTC" })).toBe("grand-larcenys-heist-otc");
    expect(preconSlug({ name: "Séance at Ærie", set: "DSC" })).toBe("seance-at-aerie-dsc");
  });

  it("collapses other characters into single dashes", () => {
    expect(preconSlug({ name: "  Hail, Caesar!  (Collector's Edition) ", set: "40K" })).toBe("hail-caesar-collectors-edition-40k");
  });
});

describe("isIndexedPrecon", () => {
  it("indexes precons released on or after INDEX_FROM", () => {
    expect(isIndexedPrecon({ releaseDate: INDEX_FROM })).toBe(true);
    expect(isIndexedPrecon({ releaseDate: "2026-11-13" })).toBe(true);
    expect(isIndexedPrecon({ releaseDate: "2024-12-31" })).toBe(false);
  });
});

describe("identityKey", () => {
  it("sorts colors in WUBRG order", () => {
    expect(identityKey(["G", "W", "U"])).toBe("WUG");
    expect(identityKey([])).toBe("");
  });
});

describe("withSlugs", () => {
  it("keeps slugs unique, falling back to the id on a collision", () => {
    const precons = [
      { id: "GuidedByNature_C14", name: "Guided by Nature", set: "C14" },
      { id: "GuidedByNature2_C14", name: "Guided by Nature", set: "C14" },
      { id: "Other_C14", name: "Other", set: "C14" },
    ];
    expect(withSlugs(precons).map((p) => p.slug)).toEqual(["guided-by-nature-c14", "guidedbynature2-c14", "other-c14"]);
  });

  it("numbers slugs that still collide", () => {
    const precons = [
      { id: "a_b", name: "A", set: "B" },
      { id: "A_B", name: "A", set: "B" },
    ];
    expect(withSlugs(precons).map((p) => p.slug)).toEqual(["a-b", "a-b-2"]);
  });

  it("builds a map keyed by slug", () => {
    const map = preconSlugMap([{ id: "VirtueAndValor_WOC", name: "Virtue and Valor", set: "WOC" }]);
    expect(map.get("virtue-and-valor-woc")?.id).toBe("VirtueAndValor_WOC");
  });
});

const PRECONS_FILE = path.join(process.cwd(), "public/data/precons.json");

describe.skipIf(!existsSync(PRECONS_FILE))("slugs of the generated precon list", () => {
  it("are unique and URL-safe", () => {
    const precons = JSON.parse(readFileSync(PRECONS_FILE, "utf8")) as PreconSummary[];
    const slugs = withSlugs(precons).map((p) => p.slug);
    expect(new Set(slugs).size).toBe(precons.length);
    for (const slug of slugs) expect(isUrlSafeSlug(slug), slug).toBe(true);
    // Name and set are unique in practice, so no precon should need the id fallback.
    expect(slugs).toEqual(precons.map(preconSlug));
  });
});
