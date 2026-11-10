# Brewmance

A web app for Magic: The Gathering Commander players:

1. **Deck Matchmaker** (live): pick a commander and a bracket, then swipe through cards that fit.
   The deck keeps its mana curve, ramp, draw, interaction, board wipes, protection and finishers in balance,
   with targets tuned to what EDHREC decks of that commander play, and respects the bracket's Game Changer,
   mass land denial, extra-turn and two-card combo limits (combos via Commander Spellbook). Deck settings
   (land count, role targets, curve, synergy vs. staples, budget per card, Game Changers) can be changed
   before and while swiping. Finish with basics, edit, import and export, or share the deck as a link
   (`/d/<code>`: the list itself, deflated into the URL, with a preview image for Reddit and Discord). See
   [docs/deckbuilding-review.md](docs/deckbuilding-review.md) for the reasoning behind the numbers.
2. **Goldfish** (live): an MTG Arena-style sandbox to test a deck. Drag cards between zones, click to
   play or tap, right-click for counters, tokens, flip and zone moves. London mulligan (first one free),
   scry/surveil/mill/search, commander tax, undo, keyboard shortcuts (D, U, N, S, M, ⌘Z) and an
   opening-hand simulator.
3. **Upgrade swipe** (live, `/upgrade`): start from one of about 180 precons, a deck built here or an
   imported list. Each card is a swap: the card that does the least for the deck (rarely played with this
   commander, a crowded role or curve slot) goes, the best-scoring replacement comes in. Swipe right to swap,
   left to pass, up for maybe, or keep the card to cut and get another cut. Spells trade for spells and
   lands for lands, so the deck keeps its size and land count; the bracket rules, an optional total budget
   (no single card over 40% of it) and the deck settings apply. The summary lists the swaps and copies a
   shopping list.
4. **Commander quiz** (live, `/quiz`): newcomers answer seven vibe questions (hero or villain, favorite
   universe such as Lord of the Rings or Marvel, creatures, art mood); experienced players answer seven
   questions about win condition, engine, table politics, tempo, complexity, colors and creature types.
   Then they swipe through the best-matching commanders with a "why this fits" for each, toggle popular
   picks vs. hidden gems, and start the deckbuilding swipe from their shortlist or share it as a link
   (`/q/<code>`, with a preview image).

Decks are stored in the browser (localStorage); there are no accounts.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) ·
Motion · dnd-kit · Zustand · TanStack Query · Zod · Recharts · Vitest · Playwright. Deploys to Vercel as is.

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` and `pnpm build` first run `scripts/build-card-db.ts`, which downloads Scryfall's bulk data
(about 30 MB, cached in `.cache/`) and writes:

| File | Used by |
| --- | --- |
| `data/cards.json` | API routes: every Commander-legal card with roles (ramp, draw, removal, …) |
| `data/tokens.json` | API routes: tokens for the goldfish sandbox (`/api/tokens`) |
| `public/data/commanders.json` | Client: all legal commanders with themes, tribes, archetypes and set |

Then `scripts/build-recs-snapshot.ts` downloads EDHREC's bulk data (`edhrec.com/data/data.tgz`, about
275 MB, cached in `.cache/edhrec-bulk/`) and condenses it into `data/recs-snapshot/{commander}.json`
(about 3,300 files, 26 MB): each commander's deck count, its 200 most played cards and up to 60 more with
high synergy. API routes read these when EDHREC's pages cannot be asked. The step takes about 20 seconds;
if it fails, the build goes on without the snapshot.

Last, `scripts/build-precons.ts` writes the precons for the upgrade swipe: `public/data/precons.json` (name,
commanders, colors and image of each) and `public/data/precons/{id}.json` (one card list each). Precon lists
never change, so they live in the repository (`scripts/precons-baseline.json`, from MTGJSON) and a build
only asks MTGJSON for its deck index and for decks released since. `pnpm precons` saves those new decks
into the baseline, worth committing now and then; without it they are fetched again on every fresh build.

The data is rebuilt when it is older than a week; `pnpm data` rebuilds it now.

Other scripts: `pnpm test` (Vitest), `pnpm test:e2e` (Playwright smoke test; needs network for EDHREC and
Scryfall, run `pnpm exec playwright install chromium` once; `PORT=3001 pnpm test:e2e` runs it against a dev
server on another port), `pnpm lint`, `pnpm typecheck`.

## Design

"Arcane Slate", a tabletop look rather than stock shadcn: cool graphite surfaces with the color kept out of
the chrome. The main button is card paper (`primary`, the cream of a card's text box) with dark ink text.
Periwinkle (`brand`, blue mana / planeswalker spark) marks selections, progress and key figures and fills
the cauldron; teal (`teal`) is the maybe pile, amber (`ember`) a warning or a value changed from the
recommendation. Text and accents meet WCAG AA (text 15.6:1, brand 7.7:1 on the background). Tokens live in
`app/globals.css`; `lib/brand.tsx` mirrors them as hex for the generated icons and Open Graph image.

- **Name:** the site name lives only in `SITE.name` (`lib/site.ts`); header, footer, metadata, legal pages
  and the Open Graph image read it from there, and the logo mark has no lettering.
  The browser storage keys `commander-tinder` and `commander-tinder-quiz` keep the old name on purpose:
  renaming them would drop every saved deck and quiz.
- **Type:** Alegreya for headings at weight 500 (600 for titles set over artwork, stamps and the wordmark),
  Archivo (with its width axis) for UI and body text. `ui-label` gives semi-condensed labels in sentence
  case, `numeral` big tabular counters. Hierarchy comes from size and color, not weight: nothing is bolder
  than 600. No upper-case eyebrows over headings, no gradient text.
- **Shape:** small radii (3px controls, 6px panels, 8px dialogs); cards keep their printed 4.75% corner.
  Shadows are hard ink edges plus a short drop (`shadow-sm` … `shadow-2xl` are redefined), no glows.
- **Motion:** one easing curve for every interface transition (`--default-transition-timing-function`). Bars
  grow by `transform`, never by animating width or height; hovers change a color or lift a few pixels.
- **Small moments:** kept to what is rare or just finished, never next to something to decide. A finished
  deck or upgrade steams in the deck's own colors and gets a line of flavor text (`lib/flavor.ts`, set like
  a card's flavor text; so do empty states). A check pops when a role reaches its target, counters tick,
  the next card to cut rises into its strip, the commander on a deck page has a foil sheen on hover, and the
  home page cauldron bubbles faster while the main button is hovered. All of it stops under reduced motion.
- **Surfaces:** `panel` (raised), `panel-inset` (recessed well), `playmat` (goldfish table). These are
  `@utility` classes, so variants such as `hover:` or `[&_h3]:` work on them.
- **Icons:** [Phosphor](https://phosphoricons.com) in the bold weight via `components/icons.tsx`, plus
  the [Mana](https://mana.andrewgioia.com) font (SIL OFL) for tap and card type symbols (`ManaGlyph`).
  Mana costs stay Scryfall's SVGs. Import icons from `@/components/icons`, not from an icon package.

## Data sources

- **[Scryfall](https://scryfall.com/docs/api)**: card data, images and the Game Changer flag
  (`game_changer`). Card roles come from Scryfall Tagger oracle tags (`oracle_tags` bulk file).
- **[EDHREC](https://edhrec.com)**: per-commander card suggestions with synergy and inclusion,
  filtered by bracket and theme. EDHREC has no official API; the app reads the JSON its own site uses
  (`json.edhrec.com/pages/commanders/{slug}[/{bracket}][/{theme}].json`) through a cached server
  route. When EDHREC cannot be asked (down, busy or rate limiting us), the suggestions come from a
  snapshot of EDHREC's bulk data instead (across all brackets, without themes); commanders EDHREC has
  no data on get the app's own popularity/theme scoring.
  EDHREC allows this under its data policy (at most one request per second, a User-Agent with a contact
  email; see `docs/edhrec-data-policy.md`). Requests to EDHREC are spaced one second apart per server
  instance and during the card database build.
- **[MTGJSON](https://mtgjson.com)** (MIT): the card lists of the preconstructed Commander decks, read at
  build time only (`DeckList.json` and `decks/{fileName}.json`). Collector's Editions and reprints of a
  deck are folded into one entry.
- **Commander archetypes** for the quiz (`lib/tagging/archetypes.ts`) combine Scryfall Tagger tags on
  each commander with EDHREC theme pages (`pages/tags/{theme}.json`, top commanders per theme) and color
  pages (`pages/commanders/{colors}.json`, deck totals). The card database build fetches these ~85
  pages one per second, caches them in `.cache/edhrec/` for a week and keeps going without them if EDHREC is down.

## Project layout

```
app/                 pages and API routes (api/candidates, api/commander-insights, api/cards/*), legal pages, metadata routes
components/          UI: build/ (commander + bracket picker), swipe/, upgrade/, quiz/, deck/ (editor), goldfish/, card/, ui/ (shadcn),
                     legal/ (prose), icons.tsx (Phosphor + Mana font)
lib/cards/           card types, names/slugs, mana helpers, image URLs
lib/tagging/         roles (Tagger tags), commander themes, tribes and archetypes
lib/quiz/            quiz questions, franchises and the commander scoring
lib/deckbuilder/     deck template, bracket rules, scoring, swipe session, upgrade swaps, basic land fill
lib/precons/         precon lists: MTGJSON condensing and turning a list into a deck
lib/deck-io/         deck list import/export
lib/goldfish/        pure game actions (zones, mulligan, tokens, …) and the opening-hand simulator
lib/server/          server-only card database and candidate pool
lib/site.ts          site URL, description and the provider details for Impressum and privacy policy
stores/              decks.ts (persisted decks, swipe sessions and upgrades), game.ts (goldfish game with undo),
                     quiz.ts (persisted quiz answers and commander shortlist)
scripts/             card database, recommendation snapshot and precon builds
```

## Deployment

The app deploys to Vercel as is: import the repository, keep the detected Next.js preset and the default
build command (`pnpm build`, which first downloads the Scryfall bulk data).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public origin without trailing slash, e.g. `https://brewmance.com`. Used for `metadataBase` (canonical and Open Graph URLs), `robots.txt` and `sitemap.xml`. |
| `RECS_SOURCE` | no | Where deck statistics come from: `edhrec` (default) or `off`. `off` sends no request to EDHREC, neither at runtime nor in the build, removes the bulk data snapshot, and suggestions fall back to Scryfall popularity, themes and roles. Unknown values count as `off`. |

Without `NEXT_PUBLIC_SITE_URL`, `lib/site.ts` falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`
(the production domain, set automatically) and then to `http://localhost:3000`. Set it for Production
in *Project Settings → Environment Variables* once the custom domain is live, then redeploy.

To switch EDHREC off, set `RECS_SOURCE=off` for Production (build and runtime both read it) and redeploy.
The new deployment rebuilds the card data without EDHREC themes, and Vercel's CDN does not serve
responses cached by the previous deployment.

### Domain

Add the domain in *Project Settings → Domains*, point DNS to Vercel as shown there, and redirect the
`www` variant (or the apex) to the primary domain. Vercel issues the TLS certificate. Then set
`NEXT_PUBLIC_SITE_URL` to the primary domain.

Optional: set *Functions → Region* to Frankfurt (`fra1`) so API routes run in the EU.

### Weekly card data refresh (Deploy Hook)

1. In Vercel, *Project Settings → Git → Deploy Hooks*, create a hook for the `main` branch.
2. In GitHub, *Settings → Secrets and variables → Actions*, add the hook URL as `VERCEL_DEPLOY_HOOK_URL`.

`.github/workflows/refresh-card-data.yml` calls the hook every week, which rebuilds the site with fresh
Scryfall data.

### Security headers

`next.config.ts` sends a Content Security Policy (images and mana symbols only from `cards.scryfall.io`
and `svgs.scryfall.io`, no framing), `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy` and HSTS. Preview deployments additionally allow `vercel.live` for the
Vercel Toolbar. If you add a third-party script, image host or API that the browser calls directly,
extend the CSP there and update the privacy policy (`app/datenschutz/page.tsx`).

### Before going live

- Brewmance runs as Leonard's private, non-commercial hobby project, which fits Vercel's Hobby plan.
  Provider details for `/impressum` and `/datenschutz` live in `lib/site.ts` (`OPERATOR`).
- If the project ever earns money (ads, donations, paid features) or moves to a company, revisit the
  Impressum, the privacy policy and the Vercel plan.

## Pages and SEO

`/about`, `/impressum` and `/datenschutz` (German, with an English translation; `/imprint` and `/privacy`
redirect there). Metadata, Open Graph and Twitter cards are set in `app/layout.tsx`; the social image
(`app/opengraph-image.tsx`), favicon (`app/icon.svg`), Apple touch icon, `robots.txt`, `sitemap.xml` and
the web app manifest are generated from `app/`.

## Legal

Brewmance is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed
by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
