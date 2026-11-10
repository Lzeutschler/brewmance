import type { CardImage, Color } from "@/lib/cards/types";

/** A preconstructed Commander deck as the picker shows it. */
export interface PreconSummary {
  /** MTGJSON's file name, e.g. "VirtueAndValor_WOC". */
  id: string;
  name: string;
  /** Set code of the product, e.g. "WOC". */
  set: string;
  /** ISO date, e.g. "2023-09-08". */
  releaseDate: string;
  /** One name, or two for decks led by a pair. */
  commanders: string[];
  colorIdentity: Color[];
  image: CardImage | null;
}

/** A precon's card list: names and counts, without the commanders. */
export interface PreconList {
  id: string;
  name: string;
  set: string;
  releaseDate: string;
  commanders: string[];
  cards: [name: string, count: number][];
}
