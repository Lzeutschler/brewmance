import type { Metadata } from "next";
import Link from "next/link";

import { LandCalculator } from "@/components/learn/land-calculator";
import { LearnArticle } from "@/components/learn/learn-article";
import { LearnProse, Term } from "@/components/learn/learn-prose";
import { karstenLands, recommendTemplate } from "@/lib/deckbuilder/template";
import { DECK_SIZE } from "@/lib/decks/types";
import { learnPage } from "@/lib/learn";
import { canonical } from "@/lib/metadata";
import { SITE } from "@/lib/site";

const page = learnPage("/learn/how-many-lands");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

/** A deck in the middle of the range: an average mana value of 3 and ten cheap ramp or draw spells. */
const TYPICAL = { manaValue: 3, cheap: 10 };
const TABLE_MANA_VALUES = [2.5, 3, 3.5, 4];
const TABLE_CHEAP = [5, 10, 15];

/** The formula's three numbers, read back from the code so the page never drifts from it. */
const BASE = karstenLands(0, 0);
const PER_MANA_VALUE = karstenLands(1, 0) - BASE;
const PER_CHEAP_SPELL = BASE - karstenLands(0, 1);

/** The casual brackets' default land counts and the typical deck's formula result set the range in the lead. */
const CASUAL_DEFAULTS = ([1, 2, 3] as const).map((bracket) => recommendTemplate(bracket, [], null).lands);
const TYPICAL_LANDS = Math.round(karstenLands(TYPICAL.manaValue, TYPICAL.cheap));
const LOW = Math.min(...CASUAL_DEFAULTS, TYPICAL_LANDS);
const HIGH = Math.max(...CASUAL_DEFAULTS, TYPICAL_LANDS);

function fixed(value: number): string {
  return value.toFixed(2);
}

export default function HowManyLandsPage() {
  return (
    <LearnArticle
      path={page.path}
      lead={
        <>
          Most Commander decks play {LOW} to {HIGH} lands. How many your deck needs depends on how much your spells cost
          and how much cheap ramp and card draw you play.
        </>
      }
      next={{
        title: "Build a deck with the right land count",
        text: "The builder sets a land count for your commander and adds basic lands to reach it.",
        href: "/build",
        label: "Build a deck",
      }}
    >
      <LandCalculator />

      <LearnProse>
        <p>
          Move the slider to your deck&apos;s average <Term id="mana-value">mana value</Term>: the total cost of your
          nonland cards divided by how many there are. Most deck sites show it in their stats. Then count the{" "}
          <Term id="ramp">ramp</Term> and <Term id="card-draw">card draw</Term> spells that cost 2 mana or less.
        </p>

        <h2>Typical cases</h2>
        <p>
          A deck with an average mana value of {TYPICAL.manaValue.toFixed(1)} and {TYPICAL.cheap} cheap ramp or draw
          spells comes out at {TYPICAL_LANDS}. The table shows how the number moves from there.
        </p>
        <div className="overflow-x-auto">
          <table>
            <caption>Lands for a {DECK_SIZE}-card deck, rounded</caption>
            <thead>
              <tr>
                <th scope="col">Average mana value</th>
                {TABLE_CHEAP.map((cheap) => (
                  <th key={cheap} scope="col" data-num>
                    {cheap} cheap
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_MANA_VALUES.map((manaValue) => (
                <tr key={manaValue}>
                  <th scope="row">
                    {manaValue.toFixed(1)}
                  </th>
                  {TABLE_CHEAP.map((cheap) => (
                    <td key={cheap} data-num className="text-foreground">
                      {Math.round(karstenLands(manaValue, cheap))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The formula behind it: lands = {fixed(BASE)} + {fixed(PER_MANA_VALUE)} × average mana value −{" "}
          {fixed(PER_CHEAP_SPELL)} × cheap ramp and card draw spells. Each full point of average mana value adds about{" "}
          {Math.round(PER_MANA_VALUE)} lands. Each cheap ramp or draw spell saves {fixed(PER_CHEAP_SPELL)} of a land,
          so about one land for every {Math.round(1 / PER_CHEAP_SPELL)} of them.
        </p>

        <h2>What counts as a land</h2>
        <p>
          Count every card whose front is a land: basic lands, dual lands and lands with an extra ability. Some cards
          have a spell on the front and a land on the back. Karsten&apos;s formula counts those as part of a land; the
          deck stats on {SITE.name} count them as spells.
        </p>
        <p>
          Mana rocks such as Sol Ring and creatures that tap for mana are not lands. They are ramp, and the cheap ones
          belong in the second number.
        </p>

        <h2>Why cheap ramp lets you play fewer</h2>
        <p>
          A land is only there to give you mana. A 2-mana spell that puts a land onto the battlefield or adds mana does
          the same job, and it also grows your mana faster than one land per turn. A cheap card draw spell helps you find the lands
          in your deck. Expensive spells work the other way: a hand of 5- and 6-mana spells does nothing until you have
          five or six lands, so a deck with a high average needs more.
        </p>
        <p>
          If you are between two numbers, take the higher one while you learn the deck. You can always cut a land once
          you have played a few games. A <Term id="goldfish">goldfish</Term> game, where you play your deck alone for a
          few turns, shows quickly whether you miss land drops.
        </p>

        <h2>Where the formula comes from</h2>
        <p>
          It is Frank Karsten&apos;s, from his article &ldquo;How Many Lands Do You Need in Your Deck? An Updated
          Analysis&rdquo;, first published on ChannelFireball. When you <Link href="/build">build a deck</Link> here,
          the deck stats use it to check your land count.
        </p>
        <p>
          Prefer a deck that already has its lands counted? Look through the <Link href="/precons">precons</Link>,
          the ready-made Commander decks you can buy in a box.
        </p>
      </LearnProse>
    </LearnArticle>
  );
}
