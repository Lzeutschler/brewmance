import type { Metadata } from "next";

import { SITE } from "@/lib/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** Open Graph fields every page shares. Title and description come from each page's own metadata. */
export const OPEN_GRAPH = {
  type: "website",
  siteName: SITE.name,
  locale: "en_US",
} satisfies OpenGraph;

/** The site-wide image rendered by `app/opengraph-image.tsx`. */
export const SITE_IMAGE = {
  alt: `${SITE.name} — ${SITE.tagline}`,
  size: { width: 1200, height: 630 },
  contentType: "image/png",
};

/**
 * Canonical link and og:url for a page; `path` resolves against `metadataBase`. Next.js merges metadata shallowly,
 * so a page's `openGraph` replaces the layout's, including the site-wide image: this one brings both back.
 * Not for routes with their own opengraph-image file, since an explicit image here would replace it.
 */
export function canonical(path: string): Pick<Metadata, "alternates" | "openGraph"> {
  const image = { url: "/opengraph-image", alt: SITE_IMAGE.alt, type: SITE_IMAGE.contentType, ...SITE_IMAGE.size };
  return {
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH, images: image, url: path },
  };
}
