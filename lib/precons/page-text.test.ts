import { describe, expect, it } from "vitest";

import type { Card } from "@/lib/cards/types";
import { card } from "@/tests/fixtures";

import type { PreconAnalysis } from "./analysis";
import {
  colorWords,
  DESCRIPTION_MAX,
  identityLabel,
  landLine,
  preconDescription,
  preconTitle,
  printedBracket,
  thinRoles,
} from "./page-text";

/** The bracket part of an analysis for these cards, with the real Core check. */
function bracketOf(cards: Card[]): Pick<PreconAnalysis, "gameChangers" | "massLandDenial"> {
  return {
    gameChangers: cards.filter((c) => c.gameChanger).map((c) => c.name),
    massLandDenial: cards.filter((c) => c.roles.includes("mld")).map((c) => c.name),
  };
}

const plain = (name: string) => card({ name });
const changer = (name: string) => card({ name, gameChanger: true });

describe("colorWords and identityLabel", () => {
  it("names colors in WUBRG order", () => {
    expect(colorWords(["G", "W"])).toBe("white and green");
    expect(colorWords(["B", "U", "W"])).toBe("white, blue and black");
    expect(colorWords([])).toBe("colorless");
  });

  it("adds the colors to a guild or shard name only", () => {
    expect(identityLabel(["G", "W"])).toBe("Selesnya (white and green)");
    expect(identityLabel(["R"])).toBe("Mono-Red");
    expect(identityLabel([])).toBe("Colorless");
  });
});

describe("preconTitle", () => {
  it("shortens long names", () => {
    expect(preconTitle("Virtue and Valor")).toBe("Virtue and Valor precon: what it does, decklist and upgrades");
    expect(preconTitle("Revival Trance (FINAL FANTASY VI)")).toBe("Revival Trance (FINAL FANTASY VI) precon: decklist and upgrades");
    expect(preconTitle("Angels: They're Just Like Us but Cooler and with Wings")).toBe(
      "Angels: They're Just Like Us but Cooler and with Wings precon",
    );
  });
});

describe("preconDescription", () => {
  const analysis = {
    lands: 39,
    gameChangers: [],
    colorIdentity: ["W", "G"] as PreconAnalysis["colorIdentity"],
    commanders: [{ name: "Ellivere of the Wild Court" }] as PreconAnalysis["commanders"],
  };

  it("describes the deck from its data", () => {
    expect(preconDescription({ name: "Virtue and Valor", releaseDate: "2023-09-08" }, analysis)).toBe(
      "Virtue and Valor is a Selesnya (white and green) Commander precon from 2023, led by Ellivere of the Wild Court. " +
        "39 lands, no Game Changers.",
    );
    expect(
      preconDescription(
        { name: "Pod", releaseDate: "2025-01-01" },
        { ...analysis, colorIdentity: ["R"], commanders: [{ name: "Krenko" }] as PreconAnalysis["commanders"] },
      ),
    ).toBe("Pod is a Mono-Red Commander precon from 2025, led by Krenko. 39 lands, no Game Changers. Decklist, stats and where to start upgrading.");
  });

  it("uses an before a vowel and stays within the limit for long names", () => {
    const long = preconDescription(
      { name: "Angels: They're Just Like Us but Cooler and with Wings", releaseDate: "2024-03-01" },
      {
        ...analysis,
        colorIdentity: ["W", "B", "G"],
        gameChangers: ["A", "B"],
        commanders: [{ name: "Some Very Long Commander Name, the Second" }] as PreconAnalysis["commanders"],
      },
    );
    expect(long).toContain("is an Abzan");
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
});

describe("printedBracket", () => {
  it("keeps Core when the check finds nothing", () => {
    expect(printedBracket(bracketOf([plain("A"), plain("B")]))).toEqual({ bracket: 2, name: "Core", reasons: [] });
  });

  it("lands in Upgraded with one to three Game Changers", () => {
    const result = printedBracket(bracketOf([changer("Smothering Tithe"), plain("B")]));
    expect(result.bracket).toBe(3);
    expect(result.name).toBe("Upgraded");
    expect(result.reasons).toEqual([{ kind: "game-changers", names: ["Smothering Tithe"] }]);
  });

  it("lands in Optimized with four Game Changers or mass land denial, naming the cards", () => {
    expect(printedBracket(bracketOf(["A", "B", "C", "D"].map(changer))).bracket).toBe(4);
    const mld = printedBracket(bracketOf([card({ name: "Armageddon", roles: ["mld"] })]));
    expect(mld.bracket).toBe(4);
    expect(mld.reasons).toEqual([{ kind: "mass-land-denial", names: ["Armageddon"] }]);
  });

  it("does not move a list up for extra turns alone", () => {
    const turns = printedBracket(
      bracketOf([card({ name: "Time Warp", roles: ["extraturn"] }), card({ name: "Temporal Manipulation", roles: ["extraturn"] })]),
    );
    expect(turns).toEqual({ bracket: 2, name: "Core", reasons: [] });
  });
});

describe("thinRoles", () => {
  it("lists roles below target, the biggest gap first", () => {
    const roles: PreconAnalysis["roles"] = [
      { role: "ramp", label: "Ramp", have: 9, target: 10 },
      { role: "draw", label: "Card Draw", have: 12, target: 10 },
      { role: "interaction", label: "Interaction", have: 4, target: 8 },
      { role: "boardwipe", label: "Board Wipes", have: 1, target: 3 },
      { role: "protection", label: "Protection", have: 6, target: 2 },
    ];
    const thin = thinRoles({ roles, thin: ["ramp", "interaction", "boardwipe"] });
    expect(thin.map((t) => t.role)).toEqual(["boardwipe", "interaction", "ramp"]);
    expect(thin[0].name + thin[0].rest).toBe("Board wipes are light: 1 of the usual 3.");
    expect(thin[2].name + thin[2].rest).toBe("Ramp is light: 9 of the usual 10.");
  });
});

describe("landLine", () => {
  it("compares the lands with Karsten's number", () => {
    const line = landLine({ have: 38, karsten: 40, typical: 37 });
    expect(line && line.before + line.link + line.after).toBe("38 lands. Frank Karsten's formula suggests 40 for this curve.");
    const same = landLine({ have: 39, karsten: 39, typical: 37 });
    expect(same && same.before + same.link + same.after).toBe("39 lands, the same as Frank Karsten's formula suggests for this curve.");
    expect(landLine({ have: 20, karsten: null, typical: 37 })).toBeNull();
  });
});
