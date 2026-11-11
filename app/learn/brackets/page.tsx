import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";

import { ManaCost } from "@/components/card/mana";
import { LearnArticle } from "@/components/learn/learn-article";
import { LearnProse, Term } from "@/components/learn/learn-prose";
import { ExternalLink } from "@/components/legal/prose";
import { frontFaceName } from "@/lib/cards/names";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";
import { formatLearnDate, learnPage } from "@/lib/learn";
import { canonical } from "@/lib/metadata";
import { getCardDb } from "@/lib/server/card-db";
import { preconBracketSummary } from "@/lib/server/precons";
import { SITE } from "@/lib/site";

const page = learnPage("/learn/brackets");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

/** Wizards' articles the rules on this page come from. */
const SOURCES = {
  format: "https://magic.wizards.com/en/formats/commander",
  introduction: "https://magic.wizards.com/en/news/announcements/introducing-commander-brackets-beta",
  october2025: "https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025",
};

/** Who each bracket is for, in a few words. */
const AUDIENCE: Record<Bracket, string> = {
  1: "Theme decks",
  2: "Casual decks, most precons",
  3: "Tuned decks",
  4: "High-power decks",
  5: "Tournament decks",
};

/**
 * Two-card combos per bracket. BRACKET_INFO does not carry them as a number (the deck check uses Commander Spellbook
 * data instead), so they are taken from Wizards' introduction of the brackets, which the later updates kept.
 */
const COMBOS: Record<Bracket, string> = {
  1: "None",
  2: "None",
  3: "None early in the game",
  4: "No limit",
  5: "No limit",
};

/** What a bracket means for a game, with the game length from Wizards' October 2025 update. */
const ABOUT: Record<Bracket, React.ReactNode> = {
  1: (
    <>
      For decks built around a theme, a story or a joke, where winning comes second. A game is expected to last at least
      nine turns.
    </>
  ),
  2: (
    <>
      For casual decks that win slowly, in ways the other players can see coming and answer. Most first decks and most{" "}
      <Term id="precon">precons</Term> belong here. A game is expected to last at least eight turns.
    </>
  ),
  3: (
    <>
      For stronger decks with careful card choices that work well together. A single big turn can win the game. A game is
      expected to last at least six turns.
    </>
  ),
  4: (
    <>
      For decks that try to win as fast and as reliably as they can, with fast mana, strong{" "}
      <Term id="tutor">tutors</Term> and <Term id="combo">combos</Term>. Only the banned list limits them. A game can end
      from turn four.
    </>
  ),
  5: (
    <>
      For competitive Commander (cEDH): the strongest deck you can build, tuned for tournaments and the decks you expect
      to meet there. A game can end on any turn.
    </>
  ),
};

/** A limit from BRACKET_INFO in words; brackets 4 and 5 have no limit, stored as Infinity. */
function gameChangerLimit(max: number): string {
  if (!Number.isFinite(max)) return "No limit";
  return max === 0 ? "None" : `Up to ${max}`;
}

function extraTurnLimit(max: number): string {
  if (!Number.isFinite(max)) return "No limit";
  // Brackets 2 and 3 allow a few extra-turn cards, as long as they are not chained one after another.
  return max === 0 ? "None" : "A few, not chained";
}

interface GameChanger {
  name: string;
  manaCost: string;
}

interface GameChangerList {
  cards: GameChanger[];
  /** ISO date of the Scryfall data the list was read from, if known. */
  updated: string | null;
}

/** The Game Changers in the card database (Scryfall's `game_changer` flag), by name. Empty when the data is missing. */
async function gameChangers(): Promise<GameChangerList> {
  "use cache";
  cacheLife("max");

  let cards: GameChanger[] = [];
  try {
    const db = await getCardDb();
    cards = db.cards
      .filter((card) => card.gameChanger)
      .map((card) => ({ name: frontFaceName(card.name), manaCost: card.manaCost.split(" // ")[0] ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // data/cards.json is missing: the page leaves out the list.
  }

  let updated: string | null = null;
  try {
    const meta = JSON.parse(await readFile(path.join(process.cwd(), "data/meta.json"), "utf8")) as { scryfallUpdatedAt?: string };
    updated = /^\d{4}-\d{2}-\d{2}/.exec(meta.scryfallUpdatedAt ?? "")?.[0] ?? null;
  } catch {
    // No meta file: the date is left out.
  }
  return { cards, updated };
}

export default async function BracketsPage() {
  const [list, precons] = await Promise.all([gameChangers(), preconBracketSummary()]);

  return (
    <LearnArticle
      path={page.path}
      lead={
        <>
          A bracket is a number from 1 to 5 that says how strong a Commander deck is and what kind of game it is built for.
          Players share their bracket before a game, so everyone at the table plays against decks of similar strength.
        </>
      }
      next={{
        title: "Build a deck in your bracket",
        text: "Pick a commander and a bracket, then swipe through cards that fit both.",
        href: "/build",
        label: "Build a deck",
      }}
    >
      <LearnProse aria-labelledby="the-five-brackets">
        <h2 id="the-five-brackets">The five brackets</h2>
        <p>
          Wizards of the Coast sorts decks by a few kinds of cards that change how a game feels:{" "}
          <Term id="game-changer">Game Changers</Term>, two-card <Term id="combo">combos</Term> that win on the spot,
          extra turns, and mass land denial, which means cards like Armageddon that destroy everyone&apos;s lands.
        </p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bracket rules">
          <table className="max-sm:[&_td]:pr-2 max-sm:[&_th]:pr-2 sm:min-w-[36rem]">
            <thead>
              <tr>
                <th scope="col">Bracket</th>
                <th scope="col" className="hidden sm:table-cell">For</th>
                <th scope="col">Game Changers</th>
                <th scope="col">Two-card combos</th>
                <th scope="col">Extra turns</th>
                <th scope="col">Mass land denial</th>
              </tr>
            </thead>
            <tbody>
              {BRACKETS.map((bracket) => {
                const info = BRACKET_INFO[bracket];
                return (
                  <tr key={bracket}>
                    <th scope="row" className="whitespace-nowrap">
                      <a href={`#bracket-${bracket}`}>
                        {bracket} {info.name}
                      </a>
                    </th>
                    <td className="hidden sm:table-cell">{AUDIENCE[bracket]}</td>
                    <td>{gameChangerLimit(info.maxGameChangers)}</td>
                    <td>{COMBOS[bracket]}</td>
                    <td>{extraTurnLimit(info.maxExtraTurns)}</td>
                    <td>{info.allowMassLandDenial ? "Allowed" : "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs">
          Rules from Wizards&apos; <ExternalLink href={SOURCES.introduction}>introduction of the brackets</ExternalLink>{" "}
          and its <ExternalLink href={SOURCES.october2025}>October 2025 update</ExternalLink>. Since that update,{" "}
          <Term id="tutor">tutors</Term> (cards that search your deck for a card) are no longer limited by bracket; the
          strongest ones are Game Changers.
        </p>

        {BRACKETS.map((bracket) => (
          <section key={bracket} id={`bracket-${bracket}`} aria-labelledby={`bracket-${bracket}-title`} className="scroll-mt-20 space-y-2">
            <h3 id={`bracket-${bracket}-title`}>
              Bracket {bracket}: {BRACKET_INFO[bracket].name}
            </h3>
            <p>{ABOUT[bracket]}</p>
          </section>
        ))}
      </LearnProse>

      <LearnProse aria-labelledby="precons">
        <h2 id="precons">Which bracket are precons?</h2>
        <p>
          When the brackets launched, Wizards described Core (bracket 2) as the strength of an average modern precon. Since
          October 2025 a precon no longer counts as bracket 2 automatically, so it is worth checking the deck you have.
        </p>
        {precons.total > 0 && (
          <p>
            Of the {precons.total} precons in {SITE.name}, <strong>{precons.fitCore}</strong> keep to the card rules of Core
            as printed, and <strong>{precons.withGameChangers}</strong> contain at least one Game Changer. This check covers
            Game Changers and mass land denial, not two-card combos.
          </p>
        )}
        {precons.mostGameChangers.length > 0 && (
          <>
            <h3>Most Game Changers</h3>
            <div role="list" className="divide-y divide-border/60 text-sm">
              {precons.mostGameChangers.map((precon) => (
                <div role="listitem" key={precon.slug} className="flex min-h-10 items-center justify-between gap-3 py-1.5">
                  <Link href={`/precons/${precon.slug}`} className="min-w-0">
                    {precon.name}
                  </Link>
                  <span className="shrink-0 tabular-nums">
                    {precon.gameChangers.length} {precon.gameChangers.length === 1 ? "Game Changer" : "Game Changers"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        <p>
          <Link href="/precons">See every precon</Link> with its cards, mana curve and Game Changers.
        </p>
      </LearnProse>

      <LearnProse aria-labelledby="game-changers">
        <h2 id="game-changers">Game Changers</h2>
        <p>
          Game Changers are cards Wizards lists as strong enough to swing a game on their own, such as fast mana, the strongest
          tutors and cards that lock other players out. Brackets 1 and 2 play none, bracket 3 up to three, and brackets 4
          and 5 as many as they like.
        </p>
        {list.cards.length > 0 && (
          <>
            <p>
              The list has <strong>{list.cards.length}</strong> cards right now. It comes from Scryfall&apos;s card data and
              updates with it
              {list.updated && (
                <>
                  {" "}
                  (last read <time dateTime={list.updated}>{formatLearnDate(list.updated)}</time>)
                </>
              )}
              .
            </p>
            <div role="list" aria-label="Game Changers" className="gap-x-8 text-sm sm:columns-2">
              {list.cards.map((card) => (
                <div
                  role="listitem"
                  key={card.name}
                  className="flex min-h-8 break-inside-avoid items-center justify-between gap-3 border-b border-border/60 py-1"
                >
                  <span className="min-w-0 text-foreground">{card.name}</span>
                  <ManaCost cost={card.manaCost} className="shrink-0" />
                </div>
              ))}
            </div>
          </>
        )}
        <p>
          The official list is on Wizards&apos; <ExternalLink href={SOURCES.format}>Commander format page</ExternalLink>.
        </p>
      </LearnProse>

      <LearnProse aria-labelledby="rule-0">
        <h2 id="rule-0">Talk about it before the game</h2>
        <p>
          Players call this Rule 0: before the first card is drawn, say which bracket your deck is in and mention anything
          the table might not expect. A bracket is a starting point for that talk, not a rule anyone checks.
        </p>
      </LearnProse>
    </LearnArticle>
  );
}
