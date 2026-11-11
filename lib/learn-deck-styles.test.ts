import { describe, expect, it } from "vitest";

import { DECK_STYLES, deckStyleLink } from "@/lib/learn-deck-styles";
import { GLOSSARY, GLOSSARY_GROUPS } from "@/lib/learn-glossary";
import { ARCHETYPE_IDS, ARCHETYPE_LABELS } from "@/lib/tagging/archetypes";
import { THEMES } from "@/lib/tagging/themes";

describe("deck styles", () => {
  it("explains every label a precon page can show", () => {
    for (const id of [...ARCHETYPE_IDS, ...THEMES.map((theme) => theme.id)]) {
      expect(deckStyleLink(id), id).not.toBeNull();
    }
    expect(deckStyleLink("no-such-style")).toBeNull();
  });

  it("names each style by the label on the badge", () => {
    expect(DECK_STYLES.find((style) => style.id === "style-voltron")?.term).toBe(ARCHETYPE_LABELS.voltron);
    expect(deckStyleLink("voltron")?.href).toBe("/learn/glossary#style-voltron");
  });

  it("sends themes to the style or term that means the same", () => {
    expect(deckStyleLink("sacrifice")?.href).toBe("/learn/glossary#style-aristocrats");
    expect(deckStyleLink("combat")?.href).toBe("/learn/glossary#style-aggro");
    expect(deckStyleLink("draw")?.href).toBe("/learn/glossary#card-draw");
    expect(GLOSSARY.some((entry) => entry.id === "card-draw")).toBe(true);
  });

  it("keeps anchors unique on the glossary page", () => {
    const anchors = [
      ...DECK_STYLES.map((style) => style.id),
      ...GLOSSARY.map((entry) => entry.id),
      ...GLOSSARY_GROUPS.map((group) => `group-${group.id}`),
      "group-styles",
    ];
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const style of DECK_STYLES) expect(style.id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("keeps the explanations short and sorted by label", () => {
    for (const style of DECK_STYLES) {
      expect(style.text.split(/(?<=[.?])\s+(?=[A-Z])/).length, style.id).toBeLessThanOrEqual(2);
      expect(style.text, style.id).not.toContain("!");
      expect(style.text.endsWith("."), style.id).toBe(true);
    }
    const terms = DECK_STYLES.map((style) => style.term.replace(/^\W+/, ""));
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b)));
  });
});
