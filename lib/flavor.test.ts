import { describe, expect, it } from "vitest";

import { FLAVOR, pickFlavor } from "./flavor";

describe("pickFlavor", () => {
  it("gives the same line for the same seed", () => {
    expect(pickFlavor(FLAVOR.brewed, "deck-1")).toBe(pickFlavor(FLAVOR.brewed, "deck-1"));
  });

  it("always picks a line of the list, also for an empty seed", () => {
    for (const seed of ["", "a", "deck-1", "1f5e8bcc-0d46-4f50-a663-443b3d2d72ae"]) {
      expect(FLAVOR.upgraded).toContain(pickFlavor(FLAVOR.upgraded, seed));
    }
  });

  it("spreads different seeds over the lines", () => {
    const seen = new Set(Array.from({ length: 40 }, (_, i) => pickFlavor(FLAVOR.brewed, `deck-${i}`)));
    expect(seen.size).toBeGreaterThan(1);
  });
});
