import { readFile } from "node:fs/promises";
import path from "node:path";

import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";

import { LEARN_PAGES } from "@/lib/learn";
import { isIndexedPrecon } from "@/lib/precons/slug";
import { listPrecons } from "@/lib/server/precons";
import { SITE } from "@/lib/site";

type ChangeFrequency = "weekly" | "monthly" | "yearly";

/** Public, crawlable pages. Deck pages live in the visitor's browser and are left out. */
const ROUTES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/build", changeFrequency: "weekly", priority: 0.9 },
  { path: "/upgrade", changeFrequency: "weekly", priority: 0.8 },
  { path: "/quiz", changeFrequency: "monthly", priority: 0.8 },
  { path: "/goldfish", changeFrequency: "monthly", priority: 0.7 },
  { path: "/precons", changeFrequency: "weekly", priority: 0.8 },
  { path: "/precons/find", changeFrequency: "monthly", priority: 0.7 },
  { path: "/quiz/colors", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.4 },
  { path: "/impressum", changeFrequency: "yearly", priority: 0.1 },
  { path: "/datenschutz", changeFrequency: "yearly", priority: 0.1 },
];

/** Day the precon data was generated, so an announced deck never gets a lastmod in the future. */
async function preconDataDay(): Promise<string | null> {
  "use cache";
  cacheLife("max");
  try {
    const meta = JSON.parse(await readFile(path.join(process.cwd(), "data/precons-meta.json"), "utf8")) as {
      generatedAt?: unknown;
    };
    return typeof meta.generatedAt === "string" ? meta.generatedAt.slice(0, 10) : null;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [precons, dataDay] = await Promise.all([listPrecons(), preconDataDay()]);

  const routes = ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE.url}${path}`,
    changeFrequency,
    priority,
  }));

  const learn = LEARN_PAGES.map((page) => ({
    url: `${SITE.url}${page.path}`,
    lastModified: page.updated,
    changeFrequency: "monthly" as const,
    priority: page.path === "/learn" ? 0.7 : 0.6,
  }));

  const preconPages = precons.filter(isIndexedPrecon).map((precon) => ({
    url: `${SITE.url}/precons/${precon.slug}`,
    lastModified: dataDay && precon.releaseDate > dataDay ? dataDay : precon.releaseDate,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...routes, ...learn, ...preconPages];
}
