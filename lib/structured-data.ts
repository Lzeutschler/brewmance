import { OPERATOR, SITE } from "@/lib/site";

/**
 * Builders for the schema.org JSON-LD that pages render through `components/json-ld.tsx`. They return plain,
 * JSON-serializable objects with absolute URLs, so they work the same in a prerendered page and in a test.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonLdObject = { [key: string]: JsonValue };

const CONTEXT = "https://schema.org";

/** Absolute URL for a path on this site; keeps a `#fragment`. The home page is `SITE.url` with a trailing slash. */
export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE.url}/`).toString();
}

export function websiteLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: "en",
  };
}

export function webApplicationLd({
  name = SITE.name,
  path = "/",
  description = SITE.description,
}: { name?: string; path?: string; description?: string } = {}): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebApplication",
    name,
    url: absoluteUrl(path),
    description,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: "en",
  };
}

export interface LinkItem {
  name: string;
  path: string;
}

/** Breadcrumb trail, outermost first, e.g. Home › Learn › Commander glossary. */
export function breadcrumbLd(items: readonly LinkItem[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** The same Person as on the about page (`personLd`), linked by its @id. */
function author(): JsonLdObject {
  const about = absoluteUrl("/about");
  return { "@type": "Person", "@id": `${about}#person`, name: OPERATOR.name, url: about };
}

/** A guide page. `updated` (and `published`, which defaults to it) are ISO dates such as "2026-11-11". */
export function articleLd({
  title,
  description,
  path,
  updated,
  published = updated,
}: {
  title: string;
  description: string;
  path: string;
  updated: string;
  published?: string;
}): JsonLdObject {
  const url = absoluteUrl(path);
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl("/opengraph-image"),
    datePublished: published,
    dateModified: updated,
    author: author(),
    publisher: { "@type": "Organization", name: SITE.name, url: absoluteUrl("/") },
    inLanguage: "en",
  };
}

export function itemListLd(items: readonly LinkItem[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** The glossary: each term gets an id pointing at its anchor on the page. */
export function definedTermSetLd({
  name,
  path,
  terms,
}: {
  name: string;
  path: string;
  terms: readonly { id: string; name: string; description: string }[];
}): JsonLdObject {
  const set = absoluteUrl(path);
  return {
    "@context": CONTEXT,
    "@type": "DefinedTermSet",
    "@id": set,
    name,
    url: set,
    hasDefinedTerm: terms.map((term) => ({
      "@type": "DefinedTerm",
      "@id": absoluteUrl(`${path}#${term.id}`),
      name: term.name,
      description: term.description,
      url: absoluteUrl(`${path}#${term.id}`),
      inDefinedTermSet: set,
    })),
  };
}

/** The about page as a profile of the person who runs the site. `sameAs` are their profiles elsewhere. */
export function personLd({ sameAs = [] }: { sameAs?: readonly string[] } = {}): JsonLdObject {
  const page = absoluteUrl("/about");
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    url: page,
    mainEntity: {
      "@type": "Person",
      "@id": `${page}#person`,
      name: OPERATOR.name,
      url: OPERATOR.website,
      sameAs: [...sameAs],
    },
  };
}
