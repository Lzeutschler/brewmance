import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

/** Public, crawlable pages. Deck pages live in the visitor's browser and are left out. */
const ROUTES: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/build", changeFrequency: "weekly", priority: 0.9 },
  { path: "/upgrade", changeFrequency: "weekly", priority: 0.8 },
  { path: "/quiz", changeFrequency: "monthly", priority: 0.8 },
  { path: "/goldfish", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.4 },
  { path: "/impressum", changeFrequency: "yearly", priority: 0.1 },
  { path: "/datenschutz", changeFrequency: "yearly", priority: 0.1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE.url}${path}`,
    changeFrequency,
    priority,
  }));
}
