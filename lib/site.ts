/**
 * Public URL of the site, used for canonical URLs, Open Graph, robots.txt and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production; on Vercel the production domain is the fallback.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = {
  name: "Brewmance",
  /** For the home screen icon label, where space is tight. */
  shortName: "Brewmance",
  /** The headline on the home page and in the Open Graph image. */
  tagline: "Swipe your way to a balanced, bracket-legal Commander deck",
  url: resolveSiteUrl(),
  description:
    "Find your commander, swipe through cards while the deck stays balanced and within its bracket, then goldfish it — a free deckbuilding companion for Magic: The Gathering Commander.",
  themeColor: "#0b0e13",
} as const;

/**
 * Provider of the site for the Impressum and the privacy policy. The site is a private,
 * non-commercial hobby project, so Leonard runs it as a private person (not via 45level GmbH).
 */
export const OPERATOR = {
  name: "Leonard Zeutschler",
  street: "Hobirkheide 23",
  postalCode: "45149",
  city: "Essen",
  country: { de: "Deutschland", en: "Germany" },
  email: "info@45level.com",
  website: "https://www.leonard-zeutschler.de",
} as const;

/**
 * Sent to EDHREC, Commander Spellbook and Scryfall: names the app, a contact address and the site, so
 * their operators can see who sends the requests and how to reach us instead of just blocking them.
 * EDHREC's data policy asks for the project name and a contact email, e.g. "MyCoolProject <craig@gmail.com>".
 */
export const USER_AGENT = `${SITE.name}/0.1 <${OPERATOR.email}> (+${SITE.url})`;

/** Where the Feedback dialog sends people. Not everyone from Reddit has a GitHub account, hence the email too. */
export const FEEDBACK = {
  issues: "https://github.com/Lzeutschler/brewmance/issues/new",
  /** Leonard's own address; the Impressum, privacy policy and User-Agent keep `OPERATOR.email`. */
  email: "leonard.zeutschler@45level.com",
  /** The launch thread on Reddit; set it once the post is up and the dialog offers it first. */
  reddit: null as string | null,
};

export const LEGAL_LAST_UPDATED = { de: "Oktober 2026", en: "October 2026" } as const;
