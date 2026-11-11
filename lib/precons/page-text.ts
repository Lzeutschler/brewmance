import { COLOR_NAMES, identityName, sortColors } from "@/lib/cards/colors";
import type { Color } from "@/lib/cards/types";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import type { Bracket } from "@/lib/edhrec/types";

import type { AnalysisRole, PreconAnalysis } from "./analysis";
import type { PreconSummary } from "./types";

/**
 * Plain-language text for the precon pages, built only from the precon's own analysis. Pure, so the pages and the
 * tests share it.
 */

/** Search engines show about this many characters of a description. */
export const DESCRIPTION_MAX = 160;

/** "white and green", "white, blue and black", "colorless". */
export function colorWords(colors: readonly string[]): string {
  const names = sortColors(colors).map((c) => COLOR_NAMES[c].toLowerCase());
  if (!names.length) return "colorless";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The identity's name with its colors when the name alone says nothing to a newcomer: "Selesnya (white and green)". */
export function identityLabel(colors: readonly Color[]): string {
  const sorted = sortColors(colors);
  // "Mono-White" and "Colorless" already say it.
  if (sorted.length <= 1) return identityName(sorted);
  return `${identityName(sorted)} (${colorWords(sorted)})`;
}

/** "A and B" for one or two commanders, as printed. */
export function commanderNames(names: readonly string[]): string {
  return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "no Game Changers", "1 Game Changer", "3 Game Changers". */
export function gameChangerCount(count: number): string {
  if (count === 0) return "no Game Changers";
  return `${count} Game Changer${count === 1 ? "" : "s"}`;
}

/** The page title without the site suffix, shorter for long deck names. */
export function preconTitle(name: string): string {
  if (name.length <= 20) return `${name} precon: what it does, decklist and upgrades`;
  if (name.length <= 36) return `${name} precon: decklist and upgrades`;
  return `${name} precon`;
}

const VOWEL = /^[aeiou]/i;

/** Meta description built from the data, kept within `DESCRIPTION_MAX` characters. */
export function preconDescription(
  summary: Pick<PreconSummary, "name" | "releaseDate">,
  analysis: Pick<PreconAnalysis, "lands" | "gameChangers" | "colorIdentity" | "commanders">,
): string {
  const year = summary.releaseDate.slice(0, 4);
  const leaders = commanderNames(analysis.commanders.map((c) => c.name));
  const facts = `${analysis.lands} lands, ${gameChangerCount(analysis.gameChangers.length)}.`;
  const tail = "Decklist, stats and where to start upgrading.";

  const sentence = (identity: string) =>
    `${summary.name} is ${VOWEL.test(identity) ? "an" : "a"} ${identity} Commander precon from ${year}, led by ${leaders}.`;
  const candidates = [
    `${sentence(identityLabel(analysis.colorIdentity))} ${facts} ${tail}`,
    `${sentence(identityLabel(analysis.colorIdentity))} ${facts}`,
    `${sentence(identityName(analysis.colorIdentity))} ${facts}`,
    sentence(identityName(analysis.colorIdentity)),
  ];
  const fitting = candidates.find((text) => text.length <= DESCRIPTION_MAX);
  if (fitting) return fitting;
  const last = candidates[candidates.length - 1];
  return `${last.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…`;
}

/** Why a printed list lands above Core. */
export type BracketReason = { kind: "game-changers"; names: string[] } | { kind: "mass-land-denial"; names: string[] };

export interface PrintedBracket {
  /** The lowest bracket whose rules the printed list keeps (combos not checked). */
  bracket: Bracket;
  name: string;
  /** Empty when the list keeps Core's card limits. */
  reasons: BracketReason[];
}

/**
 * The bracket the printed list lands in by the Game Changer and mass land denial limits. Two-card combos are not
 * checked, and extra turns are left out: Wizards sets no count for Core and Upgraded, only "a few, not chained", which
 * a card list cannot show. So the answer can only be too low, never too high.
 */
export function printedBracket(analysis: Pick<PreconAnalysis, "gameChangers" | "massLandDenial">): PrintedBracket {
  const gameChangers = analysis.gameChangers.length;
  const massLandDenial = analysis.massLandDenial.length > 0;

  const reasons: BracketReason[] = [];
  if (gameChangers > 0) reasons.push({ kind: "game-changers", names: analysis.gameChangers });
  if (massLandDenial) reasons.push({ kind: "mass-land-denial", names: analysis.massLandDenial });

  const fits = (b: Bracket) => {
    const rules = BRACKET_INFO[b];
    return gameChangers <= rules.maxGameChangers && (!massLandDenial || rules.allowMassLandDenial);
  };
  const bracket = ([2, 3, 4] as const).find(fits) ?? 4;
  return { bracket, name: BRACKET_INFO[bracket].name, reasons };
}

/** Sentence-case role names for running text. */
export const ROLE_NAMES: Record<AnalysisRole, string> = {
  ramp: "Ramp",
  draw: "Card draw",
  interaction: "Interaction",
  boardwipe: "Board wipes",
  protection: "Protection",
};

/** What each role does for a deck, in a few words for someone new. */
export const ROLE_WHY: Record<AnalysisRole, string> = {
  ramp: "Extra mana gets your bigger spells out sooner.",
  draw: "More cards in hand means more choices each turn.",
  interaction: "Removal and counterspells deal with what other players do.",
  boardwipe: "A board wipe clears the table when someone pulls ahead.",
  protection: "Protection keeps your commander and key cards alive.",
};

export interface ThinRole {
  role: AnalysisRole;
  /** "Card draw". */
  name: string;
  /** " is light: 6 of the usual 10." The page links `name` to the glossary and appends this. */
  rest: string;
  have: number;
  target: number;
}

/** Roles below their usual count, the biggest gap first. */
export function thinRoles(analysis: Pick<PreconAnalysis, "roles" | "thin">): ThinRole[] {
  return analysis.roles
    .filter((r) => analysis.thin.includes(r.role))
    .sort((a, b) => a.have / a.target - b.have / b.target || a.role.localeCompare(b.role))
    .map(({ role, have, target }) => ({
      role,
      name: ROLE_NAMES[role],
      rest: ` ${role === "boardwipe" ? "are" : "is"} light: ${have} of the usual ${target}.`,
      have,
      target,
    }));
}

/** The land count against Frank Karsten's formula, split around the formula's name so the page can link it. */
export function landLine(advice: PreconAnalysis["landAdvice"]): { before: string; link: string; after: string } | null {
  if (advice.karsten === null) return null;
  const lands = `${advice.have} land${advice.have === 1 ? "" : "s"}`;
  if (advice.karsten === advice.have) {
    return { before: `${lands}, the same as `, link: "Frank Karsten's formula", after: " suggests for this curve." };
  }
  return { before: `${lands}. `, link: "Frank Karsten's formula", after: ` suggests ${advice.karsten} for this curve.` };
}
