import type { Metadata } from "next";
import Link from "next/link";

import { ColorIdentity, ManaCost, ManaSymbol } from "@/components/card/mana";
import { ArrowRightIcon, CheckCircleIcon, XCircleIcon } from "@/components/icons";
import { LearnArticle } from "@/components/learn/learn-article";
import { LearnProse, Term } from "@/components/learn/learn-prose";
import { ExternalLink } from "@/components/legal/prose";
import { Button } from "@/components/ui/button";
import { learnPage } from "@/lib/learn";
import { canonical } from "@/lib/metadata";

const page = learnPage("/learn/how-to-play-commander");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

/** Official sources the rules on this page were checked against on 2026-11-11. */
const SOURCES = {
  howToPlay: "https://magic.wizards.com/en/how-to-play",
  format: "https://magic.wizards.com/en/formats/commander",
  rules: "https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt",
  brackets: "https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-february-9-2026",
};

const AT_A_GLANCE = [
  { value: "100", label: "cards in your deck" },
  { value: "40", label: "starting life" },
  { value: "+2", label: "more mana each time you recast your commander" },
  { value: "21", label: "commander damage and you lose" },
];

/** A commander that costs {3}{G}, cast again and again from the command zone. */
const TAX_ROWS = [
  { cast: "First", cost: "{3}{G}", total: 4 },
  { cast: "Second", cost: "{5}{G}", total: 6 },
  { cast: "Third", cost: "{7}{G}", total: 8 },
];

/** A mana symbol inside running text. */
function Sym({ symbol }: { symbol: string }) {
  return <ManaSymbol symbol={symbol} className="mx-px align-[-0.15em]" />;
}

export default function HowToPlayCommanderPage() {
  return (
    <LearnArticle
      path={page.path}
      lead="Commander is a way to play Magic, usually with four players, where every deck has 100 cards and is led by one legendary creature. This page covers the rules that make it different from a regular game."
    >
      <dl
        aria-label="Commander at a glance"
        className="panel grid grid-cols-2 sm:grid-cols-4 [&>div]:border-border [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(odd)]:border-r sm:[&>div:nth-child(-n+2)]:border-b-0 sm:[&>div:not(:last-child)]:border-r"
      >
        {AT_A_GLANCE.map((item) => (
          <div key={item.value} className="flex flex-col-reverse gap-1 px-4 py-3">
            <dt className="text-xs leading-tight text-muted-foreground">{item.label}</dt>
            <dd className="numeral text-3xl">{item.value}</dd>
          </div>
        ))}
      </dl>

      <LearnProse>
        <p>
          Everything else, from turns and mana to combat, works as in any game of Magic. If you have never played,
          Wizards&apos; <ExternalLink href={SOURCES.howToPlay}>how to play guide</ExternalLink> covers the basics.
        </p>

        <h2 id="deck-size">100 cards, one of them your commander</h2>
        <p>
          Your deck has exactly 100 cards: your <Term id="commander">commander</Term> and 99 others. Your commander is
          usually a legendary creature. If you have two commanders, for example two creatures with the Partner ability, the rest
          of the deck is 98 cards. A short list of cards is banned in Commander.
        </p>

        <h2 id="singleton">One copy of each card</h2>
        <p>
          Commander is a <Term id="singleton">singleton</Term> format: you can play only one copy of each card. Basic
          lands (such as Plains, Island, Swamp, Mountain, Forest and Wastes) are the exception, so you can play as many as you
          like. A few cards, such as Relentless Rats, say on the card that a deck can have any number of them.
        </p>

        <h2 id="command-zone">Your commander starts in the command zone</h2>
        <p>
          Before the game, you put your commander face up in the <Term id="command-zone">command zone</Term>, a space
          next to the battlefield. It is not in your library (your draw pile), so you always have it. You can cast it
          from the command zone whenever you could cast it from your hand, paying its mana cost as usual.
        </p>

        <h2 id="color-identity">Every card matches your commander&apos;s colors</h2>
        <p>
          Your commander&apos;s <Term id="color-identity">color identity</Term> decides which cards you can play. A
          card&apos;s color identity is every color in its mana cost plus any mana symbols in its rules text, so a
          white card with <Sym symbol="G" /> in its rules text counts as green too. Each card in your deck may only use colors
          your commander has, and colorless cards fit every deck.
        </p>
        <dl className="panel-inset grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 text-sm">
          <dt>Commander</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <ColorIdentity colors={["W", "U"]} />
            <span>white and blue</span>
          </dd>
          <dt className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 shrink-0 text-pick" aria-hidden />
            Fits
          </dt>
          <dd className="flex flex-wrap items-center gap-2">
            <ManaSymbol symbol="W" />
            <ManaSymbol symbol="U" />
            <ManaCost cost="{W}{U}" />
            <ManaSymbol symbol="W/U" />
            <ManaSymbol symbol="C" />
          </dd>
          <dt className="flex items-center gap-1.5">
            <XCircleIcon className="size-4 shrink-0 text-pass" aria-hidden />
            Doesn&apos;t fit
          </dt>
          <dd className="flex flex-wrap items-center gap-2">
            <ManaSymbol symbol="B" />
            <ManaSymbol symbol="R" />
            <ManaSymbol symbol="G" />
            <ManaCost cost="{W}{B}" />
            <ManaSymbol symbol="U/R" />
          </dd>
        </dl>
        <p>
          A hybrid symbol such as <Sym symbol="U/R" /> counts as both of its colors, so it only fits a deck that has
          both. The <Link href="/learn/color-combinations">color combinations guide</Link> lists the name of every
          pair and trio.
        </p>

        <h2 id="life">You start at 40 life</h2>
        <p>
          Every player starts with 40 life instead of 20. With three opponents and bigger life totals, a game of
          four often takes an hour or more.
        </p>

        <h2 id="commander-tax">Commander tax</h2>
        <p>
          Each time you cast your commander from the command zone, it costs <Sym symbol="2" /> more for every earlier
          time you cast it from there this game. This <Term id="commander-tax">commander tax</Term> only counts casts
          from the command zone.
        </p>
        <div className="overflow-x-auto">
          <table>
            <caption>
              A commander that costs <ManaCost cost="{3}{G}" className="align-[-0.15em]" />
            </caption>
            <thead>
              <tr>
                <th scope="col">Cast from the command zone</th>
                <th scope="col">You pay</th>
                <th scope="col" data-num>
                  Mana
                </th>
              </tr>
            </thead>
            <tbody>
              {TAX_ROWS.map((row) => (
                <tr key={row.cast}>
                  <td>{row.cast}</td>
                  <td>
                    <ManaCost cost={row.cost} />
                  </td>
                  <td data-num>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="commander-damage">21 commander damage</h2>
        <p>
          A player who takes 21 or more combat damage from the same commander over the game loses, even with life
          left. This is called <Term id="commander-damage">commander damage</Term>. Only combat damage counts, and each
          commander is counted on its own, so 10 from one and 11 from another is not enough. The damage still comes
          off your life total as usual.
        </p>

        <h2 id="when-your-commander-dies">When your commander dies or is exiled</h2>
        <p>
          If your commander goes to your graveyard (your discard pile) or into exile (removed from the game), you may move it back to the
          command zone. If it would go to your hand or library, you may put it into the command zone instead. You can
          also leave it where it is, for example to bring it back from the graveyard later. Casting it again from the
          command zone costs the tax.
        </p>

        <h2 id="multiplayer">Four players, everyone for themselves</h2>
        <p>
          Commander is usually played by four players, each against all the others. A random player goes first and
          turns pass to the left. On your turn you can attack any opponent, or several of them in the same combat.
        </p>
        <p>
          Everyone draws seven cards. If you don&apos;t like your hand, you can take a{" "}
          <Term id="mulligan">mulligan</Term>: shuffle it into your library, draw seven new cards, then put one card on the bottom
          of your library for each mulligan. In a multiplayer game your first mulligan is free, so the first time you
          put no card back.
        </p>

        <h2 id="brackets">Brackets and the talk before the game</h2>
        <p>
          <Term id="bracket">Brackets</Term> rate decks from 1 (Exhibition) to 5 (cEDH), so a table can match decks of
          similar strength. Before you shuffle, say which bracket your deck is in and anything unusual it does, such
          as a <Term id="combo">combo</Term> that wins on the spot. Players often call this talk Rule 0.{" "}
          <Link href="/learn/brackets">Commander brackets explained</Link> covers each bracket and the{" "}
          <Term id="game-changer">Game Changers</Term> list.
        </p>

        <p className="border-t border-border/60 pt-4 text-xs">
          Checked on November 11, 2026 against Wizards&apos;{" "}
          <ExternalLink href={SOURCES.format}>Commander format page</ExternalLink>, the{" "}
          <ExternalLink href={SOURCES.rules}>Comprehensive Rules</ExternalLink> of November 6, 2026 and the{" "}
          <ExternalLink href={SOURCES.brackets}>brackets update</ExternalLink> of February 9, 2026.
        </p>
      </LearnProse>

      <section
        aria-labelledby="first-deck"
        className="panel flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h2 id="first-deck" className="font-heading text-xl leading-tight font-medium">
            Your first deck
          </h2>
          <p className="text-sm text-muted-foreground">
            A <Term id="precon">precon</Term> is a ready-made 100-card deck and the easiest way to start.
          </p>
          <Link
            href="/learn/how-to-build-a-commander-deck"
            className="ui-label inline-flex min-h-8 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            Or build your own <ArrowRightIcon className="size-3.5 shrink-0" aria-hidden />
          </Link>
        </div>
        <Button className="shrink-0" nativeButton={false} render={<Link href="/precons/find" />}>
          Find your precon <ArrowRightIcon aria-hidden />
        </Button>
      </section>
    </LearnArticle>
  );
}
