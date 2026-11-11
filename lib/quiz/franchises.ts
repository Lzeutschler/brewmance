export type FranchiseId =
  | "magic"
  | "lotr"
  | "final-fantasy"
  | "marvel"
  | "doctor-who"
  | "warhammer"
  | "fallout"
  | "tmnt"
  | "avatar"
  | "assassins-creed"
  | "transformers"
  | "dnd"
  | "star-trek";

export interface Franchise {
  id: FranchiseId;
  label: string;
  /** Scryfall set codes whose commanders belong to the franchise. */
  sets: string[];
}

/**
 * Crossover worlds, recognized by set code. Their legends are printed only in their own sets, so the
 * set of Scryfall's chosen printing identifies them reliably. "magic" covers everything else.
 */
export const FRANCHISES: Franchise[] = [
  { id: "lotr", label: "The Lord of the Rings", sets: ["ltr", "ltc", "hob", "hoc"] },
  { id: "final-fantasy", label: "Final Fantasy", sets: ["fin", "fic", "fca"] },
  { id: "marvel", label: "Marvel", sets: ["msh", "msc", "spm", "spe"] },
  { id: "doctor-who", label: "Doctor Who", sets: ["who"] },
  { id: "warhammer", label: "Warhammer 40,000", sets: ["40k"] },
  { id: "fallout", label: "Fallout", sets: ["pip"] },
  { id: "tmnt", label: "Teenage Mutant Ninja Turtles", sets: ["tmt", "tmc"] },
  { id: "avatar", label: "Avatar: The Last Airbender", sets: ["tla", "tle"] },
  { id: "assassins-creed", label: "Assassin's Creed", sets: ["acr"] },
  { id: "transformers", label: "Transformers", sets: ["bot"] },
  { id: "dnd", label: "Dungeons & Dragons", sets: ["afr", "afc", "clb", "hbg"] },
  { id: "star-trek", label: "Star Trek", sets: ["trk", "trc"] },
];

const FRANCHISE_BY_SET = new Map(FRANCHISES.flatMap((f) => f.sets.map((set) => [set, f.id] as const)));

export const FRANCHISE_LABELS: Record<FranchiseId, string> = {
  magic: "Magic's own worlds",
  ...(Object.fromEntries(FRANCHISES.map((f) => [f.id, f.label])) as Record<Exclude<FranchiseId, "magic">, string>),
};

export function franchiseOf(set: string): FranchiseId {
  return FRANCHISE_BY_SET.get(set) ?? "magic";
}
