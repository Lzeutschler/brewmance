import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GLOSSARY_TERM_IDS } from "@/lib/learn";
import { GLOSSARY, GLOSSARY_EXAMPLES, GLOSSARY_GROUPS, glossaryEntries, splitManaText } from "@/lib/learn-glossary";

describe("glossary", () => {
  it("has exactly one entry for every term id", () => {
    const ids = GLOSSARY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...GLOSSARY_TERM_IDS].sort());
  });

  it("keeps every anchor unique on the page, group headings included", () => {
    const anchors = [...GLOSSARY.map((entry) => entry.id), ...GLOSSARY_GROUPS.map((group) => `group-${group.id}`)];
    expect(new Set(anchors).size).toBe(anchors.length);
    for (const anchor of anchors) expect(anchor).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("puts every entry in a known group, in page order", () => {
    const grouped = GLOSSARY_GROUPS.flatMap((group) => glossaryEntries(group.id));
    expect(grouped.map((entry) => entry.id)).toEqual(GLOSSARY.map((entry) => entry.id));
    expect(glossaryEntries("format")[0]?.id).toBe("edh");
  });

  it("keeps definitions short", () => {
    for (const entry of GLOSSARY) {
      const sentences = entry.text.split(/(?<=[.?])\s+(?=[A-Z])/);
      expect(sentences.length, entry.id).toBeLessThanOrEqual(3);
      expect(entry.text, entry.id).not.toContain("!");
      expect(entry.text.endsWith("."), entry.id).toBe(true);
    }
  });

  it("splits mana symbols out of the text", () => {
    expect(splitManaText("{2}{G} has a mana value of 3.")).toEqual([
      { text: "{2}{G}", mana: true },
      { text: " has a mana value of 3.", mana: false },
    ]);
    expect(splitManaText("A hybrid symbol such as {R/G} counts.")).toEqual([
      { text: "A hybrid symbol such as ", mana: false },
      { text: "{R/G}", mana: true },
      { text: " counts.", mana: false },
    ]);
    expect(splitManaText("No symbols")).toEqual([{ text: "No symbols", mana: false }]);
  });

  const cardsFile = path.join(process.cwd(), "data/cards.json");
  it.skipIf(!existsSync(cardsFile))("uses the image of each example card from the card data", () => {
    const cards = JSON.parse(readFileSync(cardsFile, "utf8")) as { name: string; image: unknown }[];
    for (const example of Object.values(GLOSSARY_EXAMPLES)) {
      const card = cards.find((c) => c.name === example.name);
      expect(card, example.name).toBeDefined();
      expect(card?.image, example.name).toEqual(example.image);
    }
  });
});
