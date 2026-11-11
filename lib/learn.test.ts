import { describe, expect, it } from "vitest";

import { GLOSSARY_TERM_IDS, LEARN_PAGES, formatLearnDate, glossaryHref, learnPage } from "@/lib/learn";
import { SITE } from "@/lib/site";

describe("learn registry", () => {
  it("keeps descriptions short enough for search results", () => {
    for (const page of LEARN_PAGES) expect(page.description.length, page.path).toBeLessThanOrEqual(155);
    expect(SITE.description.length).toBeLessThanOrEqual(160);
  });

  it("has unique paths and orders", () => {
    expect(new Set(LEARN_PAGES.map((p) => p.path)).size).toBe(LEARN_PAGES.length);
    expect(new Set(LEARN_PAGES.map((p) => p.order)).size).toBe(LEARN_PAGES.length);
    expect(learnPage("/learn/brackets").title).toBe("Commander brackets explained");
  });

  it("links glossary terms to their anchors", () => {
    expect(GLOSSARY_TERM_IDS).toHaveLength(25);
    expect(glossaryHref("ramp")).toBe("/learn/glossary#ramp");
  });

  it("formats dates without the clock", () => {
    expect(formatLearnDate("2026-11-11")).toBe("November 11, 2026");
    expect(formatLearnDate("2027-01-05")).toBe("January 5, 2027");
    expect(() => formatLearnDate("11/11/2026")).toThrow();
  });
});
