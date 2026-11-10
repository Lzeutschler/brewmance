/**
 * Builds the list of preconstructed Commander decks for the upgrade swipe from MTGJSON (MIT licensed).
 *
 * Outputs:
 *   public/data/precons.json        every precon with its commanders, colors and image, newest first
 *   public/data/precons/{id}.json   one precon's card list (names and counts)
 *   data/precons-meta.json          build timestamp
 *
 * Precon lists never change, so scripts/precons-baseline.json keeps them in the repository and a build
 * only downloads decks released since (one index request to MTGJSON, then one per new deck, cached in
 * .cache/mtgjson). `--save` writes those back into the baseline; `--force` rebuilds while the output is
 * still fresh. Needs data/cards.json from scripts/build-card-db.ts. When MTGJSON cannot be reached the
 * baseline alone is used, and a failure lets the build go on without precons.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { sortColors } from "@/lib/cards/colors";
import { frontFaceName, nameKey } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { PRECON_DECK_TYPE, condensePrecon, dropEditions, type MtgjsonDeck } from "@/lib/precons/format";
import type { PreconList, PreconSummary } from "@/lib/precons/types";

const ROOT = process.cwd();
const API = "https://mtgjson.com/api/v5";
const BASELINE_FILE = path.join(ROOT, "scripts/precons-baseline.json");
const CACHE_DIR = path.join(ROOT, ".cache/mtgjson/decks");
const CARDS_FILE = path.join(ROOT, "data/cards.json");
const CARDS_META_FILE = path.join(ROOT, "data/meta.json");
const META_FILE = path.join(ROOT, "data/precons-meta.json");
const SUMMARY_FILE = path.join(ROOT, "public/data/precons.json");
const LIST_DIR = path.join(ROOT, "public/data/precons");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Bump when the output format changes so stale local files are rebuilt. */
const SCHEMA_VERSION = 1;
const HEADERS = { "User-Agent": "precon-list-build/1.0", Accept: "application/json" };
const DOWNLOADS_AT_ONCE = 3;
/** Fewer known cards than this means the list is broken or mostly not Commander-legal. */
const MIN_KNOWN_CARDS = 90;

interface Baseline {
  /** Deck ids MTGJSON lists as Commander decks that are no complete 100-card deck. */
  skipped: string[];
  decks: PreconList[];
}

interface DeckIndexEntry {
  fileName: string;
  type: string;
}

async function main() {
  const force = process.argv.includes("--force");
  const save = process.argv.includes("--save");
  if (!force && !save && isFresh()) {
    console.log("[precons] precons are fresh, skipping (use --force to rebuild)");
    return;
  }
  if (!existsSync(CARDS_FILE)) throw new Error("data/cards.json is missing (run scripts/build-card-db.ts first)");

  const baseline: Baseline = existsSync(BASELINE_FILE)
    ? (JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Baseline)
    : { skipped: [], decks: [] };
  const decks = new Map(baseline.decks.map((d) => [d.id, d]));
  const skipped = new Set(baseline.skipped);

  const added = await addNewDecks(decks, skipped);
  if (save && added > 0) {
    const sorted = [...decks.values()].sort((a, b) => a.id.localeCompare(b.id));
    writeFileSync(BASELINE_FILE, `${JSON.stringify({ skipped: [...skipped].sort(), decks: sorted })}\n`);
    console.log(`[precons] saved ${added} new deck(s) to scripts/precons-baseline.json`);
  }

  const cards = loadCardIndex();
  const find = (name: string) => cards.get(nameKey(name)) ?? cards.get(nameKey(frontFaceName(name)));

  const summaries: PreconSummary[] = [];
  rmSync(LIST_DIR, { recursive: true, force: true });
  mkdirSync(LIST_DIR, { recursive: true });
  for (const deck of dropEditions([...decks.values()])) {
    const commanders = deck.commanders.map(find);
    const known = deck.cards.reduce((sum, [name, count]) => sum + (find(name) ? count : 0), 0);
    if (commanders.some((c) => !c) || known < MIN_KNOWN_CARDS) {
      console.warn(`[precons] leaving out ${deck.name} (${deck.id}): commander or too many cards are not Commander-legal`);
      continue;
    }
    const zone = commanders as Card[];
    summaries.push({
      id: deck.id,
      name: deck.name,
      set: deck.set,
      releaseDate: deck.releaseDate,
      commanders: zone.map((c) => c.name),
      colorIdentity: sortColors(zone.flatMap((c) => c.colorIdentity)),
      image: zone[0].image,
    });
    writeFileSync(path.join(LIST_DIR, `${deck.id}.json`), JSON.stringify({ ...deck, commanders: zone.map((c) => c.name) }));
  }

  summaries.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || a.name.localeCompare(b.name));
  writeFileSync(SUMMARY_FILE, JSON.stringify(summaries));
  writeFileSync(META_FILE, JSON.stringify({ schema: SCHEMA_VERSION, generatedAt: new Date().toISOString(), precons: summaries.length }));
  console.log(`[precons] ${summaries.length} precons`);
}

/** Fresh while younger than a week and newer than the card database, whose images the summaries carry. */
function isFresh(): boolean {
  if (!existsSync(META_FILE) || !existsSync(SUMMARY_FILE) || !existsSync(CARDS_META_FILE)) return false;
  const meta = JSON.parse(readFileSync(META_FILE, "utf8")) as { generatedAt: string; schema: number };
  const cardsMeta = JSON.parse(readFileSync(CARDS_META_FILE, "utf8")) as { generatedAt: string };
  const builtAt = new Date(meta.generatedAt).getTime();
  return meta.schema === SCHEMA_VERSION && Date.now() - builtAt < MAX_AGE_MS && builtAt >= new Date(cardsMeta.generatedAt).getTime();
}

/** Adds Commander decks MTGJSON lists that the baseline lacks; returns how many decks were new to it. */
async function addNewDecks(decks: Map<string, PreconList>, skipped: Set<string>): Promise<number> {
  let index: DeckIndexEntry[];
  try {
    index = (await fetchJson<{ data: DeckIndexEntry[] }>(`${API}/DeckList.json`)).data;
  } catch (err) {
    console.warn(`[precons] MTGJSON is unreachable, using the baseline only: ${(err as Error).message}`);
    return 0;
  }
  const missing = index
    .filter((d) => d.type === PRECON_DECK_TYPE && /^\w+$/.test(d.fileName) && !decks.has(d.fileName) && !skipped.has(d.fileName))
    .map((d) => d.fileName);
  if (!missing.length) return 0;

  console.log(`[precons] loading ${missing.length} new deck(s) from MTGJSON`);
  mkdirSync(CACHE_DIR, { recursive: true });
  let added = 0;
  await mapLimit(missing, DOWNLOADS_AT_ONCE, async (id) => {
    try {
      const deck = await loadDeck(id);
      if (deck) decks.set(id, deck);
      else skipped.add(id);
      added += 1;
    } catch (err) {
      console.warn(`[precons] could not load ${id}: ${(err as Error).message}`);
    }
  });
  return added;
}

/** One deck from the cache or MTGJSON, condensed; null when it is no complete Commander deck. */
async function loadDeck(id: string): Promise<PreconList | null> {
  const cached = path.join(CACHE_DIR, `${id}.json`);
  if (existsSync(cached)) return JSON.parse(readFileSync(cached, "utf8")) as PreconList | null;
  const { data } = await fetchJson<{ data: MtgjsonDeck }>(`${API}/decks/${id}.json`);
  const deck = condensePrecon(id, data);
  writeFileSync(cached, JSON.stringify(deck));
  return deck;
}

function loadCardIndex(): Map<string, Card> {
  const byName = new Map<string, Card>();
  for (const card of JSON.parse(readFileSync(CARDS_FILE, "utf8")) as Card[]) {
    byName.set(nameKey(card.name), card);
    const front = nameKey(frontFaceName(card.name));
    if (!byName.has(front)) byName.set(front, card);
  }
  return byName;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    }),
  );
}

main().catch((err) => {
  console.warn(`[precons] skipped: ${(err as Error).message}`);
});
