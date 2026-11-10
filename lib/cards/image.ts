import type { CardImage } from "./types";

export type ImageSize = "small" | "normal" | "large" | "art_crop" | "border_crop";

const SCRYFALL_IMAGE_HOST = "https://cards.scryfall.io";

/** Parses a Scryfall image URL like `https://cards.scryfall.io/normal/front/8/e/<id>.jpg?123`. */
export function parseScryfallImageUrl(url: string, doubleFaced: boolean): CardImage | null {
  const match = url.match(/\/(?:front|back)\/([0-9a-f]\/[0-9a-f]\/[0-9a-f-]+)\.jpg\?(\d+)/);
  if (!match) return null;
  return { key: match[1], version: match[2], doubleFaced };
}

export function cardImageUrl(
  image: CardImage,
  size: ImageSize = "normal",
  face: "front" | "back" = "front",
): string {
  return `${SCRYFALL_IMAGE_HOST}/${size}/${face}/${image.key}.jpg?${image.version}`;
}

/** Image for a bare Scryfall image key, where no card record with its version is at hand. */
export function imageUrlForKey(key: string, size: ImageSize): string {
  return [SCRYFALL_IMAGE_HOST, size, "front", key + ".jpg"].join("/");
}

/** Art crop for a bare Scryfall image key, as used by quiz answers. */
export function artCropUrl(key: string): string {
  return imageUrlForKey(key, "art_crop");
}
