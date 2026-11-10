# Design

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
- **Copy:** short, and only what someone needs to act. Where a picture can show what happens, it replaces
  the description: the ways in on the home page are a question, an action and a small scene made of real
  cards. No decorative or joking lines.
- **Motion:** one easing curve for every interface transition (`--default-transition-timing-function`). Bars
  grow by `transform`, never by animating width or height; hovers change a color or lift a few pixels.
- **Small moments:** kept to what is rare or just finished, never next to something to decide, and without
  extra copy. A finished deck or upgrade steams in the deck's own colors, a check pops when a role reaches
  its target, counters tick, the next card to cut rises into its strip, the commander on a deck page has a
  foil sheen on hover, and the home page cauldron bubbles faster while the main button is hovered. All of it
  stops under reduced motion.
- **Surfaces:** `panel` (raised), `panel-inset` (recessed well), `playmat` (goldfish table). These are
  `@utility` classes, so variants such as `hover:` or `[&_h3]:` work on them.
- **Icons:** [Phosphor](https://phosphoricons.com) in the bold weight via `components/icons.tsx`, plus
  the [Mana](https://mana.andrewgioia.com) font (SIL OFL) for tap and card type symbols (`ManaGlyph`).
  Mana costs stay Scryfall's SVGs. Import icons from `@/components/icons`, not from an icon package.
