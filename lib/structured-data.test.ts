import { describe, expect, it } from "vitest";

import { OPERATOR, SITE } from "@/lib/site";
import {
  absoluteUrl,
  articleLd,
  breadcrumbLd,
  definedTermSetLd,
  itemListLd,
  personLd,
  webApplicationLd,
  websiteLd,
  type JsonValue,
} from "@/lib/structured-data";

const URL_KEYS = new Set(["url", "item", "@id", "mainEntityOfPage", "image", "inDefinedTermSet"]);

/** Every value under a URL-like key, anywhere in the object. */
function urls(value: JsonValue, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => urls(v, found));
  else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (URL_KEYS.has(key) && typeof v === "string") found.push(v);
      else if (key === "sameAs" && Array.isArray(v)) v.forEach((s) => typeof s === "string" && found.push(s));
      else urls(v, found);
    }
  }
  return found;
}

const all = {
  website: websiteLd(),
  app: webApplicationLd(),
  appForPage: webApplicationLd({ name: "Color quiz", path: "/quiz/colors", description: "Find your colors." }),
  breadcrumb: breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Learn", path: "/learn" },
    { name: "Commander glossary", path: "/learn/glossary" },
  ]),
  article: articleLd({ title: "How to play Commander", description: "Rules.", path: "/learn/how-to-play-commander", updated: "2026-11-11" }),
  list: itemListLd([{ name: "Virtue and Valor", path: "/precons/virtue-and-valor-woc" }]),
  terms: definedTermSetLd({
    name: "Commander glossary",
    path: "/learn/glossary",
    terms: [{ id: "ramp", name: "Ramp", description: "Cards that give you extra mana." }],
  }),
  person: personLd({ sameAs: ["https://github.com/Lzeutschler"] }),
};

describe("structured data", () => {
  it("uses absolute URLs everywhere", () => {
    for (const [name, data] of Object.entries(all)) {
      const found = urls(data);
      expect(found.length, name).toBeGreaterThan(0);
      for (const url of found) expect(url, name).toMatch(/^https?:\/\/[^/]+/);
    }
    expect(absoluteUrl("/")).toBe(`${SITE.url}/`);
    expect(absoluteUrl("/learn/glossary#ramp")).toBe(`${SITE.url}/learn/glossary#ramp`);
  });

  it("survives a JSON round trip unchanged", () => {
    for (const data of Object.values(all)) {
      expect(JSON.parse(JSON.stringify(data))).toEqual(data);
      expect(data["@context"]).toBe("https://schema.org");
    }
  });

  it("numbers list items from 1 and links glossary terms to their anchors", () => {
    expect(all.breadcrumb.itemListElement).toMatchObject([{ position: 1 }, { position: 2 }, { position: 3, item: `${SITE.url}/learn/glossary` }]);
    expect(all.terms.hasDefinedTerm).toMatchObject([{ "@id": `${SITE.url}/learn/glossary#ramp`, name: "Ramp" }]);
  });

  it("credits the operator as the author and the person on the about page", () => {
    expect(all.article.author).toMatchObject({ "@type": "Person", name: OPERATOR.name, url: `${SITE.url}/about` });
    expect(all.article.dateModified).toBe("2026-11-11");
    expect(all.person).toMatchObject({ "@type": "ProfilePage", mainEntity: { "@type": "Person", name: OPERATOR.name } });
    expect(all.app).toMatchObject({ isAccessibleForFree: true, offers: { price: "0" } });
  });
});
