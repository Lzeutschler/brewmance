import type { Metadata } from "next";
import Link from "next/link";

import { LearnArticle } from "@/components/learn/learn-article";
import { LearnProse, Term } from "@/components/learn/learn-prose";
import { Curve } from "@/components/learn/visuals";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { TEMPLATE_ROLES, TEMPLATE_ROLE_LABELS, curveAverage, recommendTemplate, type TemplateRole } from "@/lib/deckbuilder/template";
import { DECK_SIZE } from "@/lib/decks/types";
import type { GlossaryTermId } from "@/lib/learn";
import { learnPage } from "@/lib/learn";
import { canonical } from "@/lib/metadata";
import { SITE } from "@/lib/site";

const page = learnPage("/learn/how-to-build-a-commander-deck");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

/** The bracket a first deck starts at, and the template the builder uses for it without commander data. */
const BRACKET = 2;
const TEMPLATE = recommendTemplate(BRACKET, ["G", "B"], null);
const ROLE_TOTAL = TEMPLATE_ROLES.reduce((sum, role) => sum + TEMPLATE.roles[role], 0);
const THEME = TEMPLATE.size - TEMPLATE.lands - ROLE_TOTAL;
const SPELLS = TEMPLATE.size - TEMPLATE.lands;
/** Spells costing 2, 3 or 4 mana: curve buckets 1 to 3. */
const MIDDLE = TEMPLATE.curve.slice(1, 4).reduce((a, b) => a + b, 0);

const ROLES: Record<TemplateRole, { term: GlossaryTermId; does: string }> = {
  ramp: { term: "ramp", does: "Extra mana, so you cast big spells sooner" },
  draw: { term: "card-draw", does: "Gives you more cards than you spend" },
  interaction: { term: "interaction", does: "Removal and counterspells for an opponent's best card" },
  boardwipe: { term: "board-wipe", does: "Clears the battlefield when you fall behind" },
  protection: { term: "protection", does: "Keeps your commander and key cards alive" },
  wincon: { term: "finisher", does: "Ends the game once you are ahead" },
};

export default function HowToBuildPage() {
  return (
    <LearnArticle
      path={page.path}
      lead={
        <>
          A Commander deck is your commander plus {DECK_SIZE} other cards: about {TEMPLATE.lands} lands, about{" "}
          {ROLE_TOTAL} cards that do a basic job like ramp or removal, and the rest for your commander&apos;s plan. Pick
          the commander first, then fill those slots and test the deck before your first game.
        </>
      }
      next={{
        title: "Build your first deck",
        text: "Pick a commander and swipe through cards that fit. The deck counts the roles for you.",
        href: "/build",
        label: "Build a deck",
      }}
    >
      <LearnProse>
        <h2>The shape of a deck</h2>
        <p>
          These numbers are a starting point for a casual deck at <Term id="bracket">bracket</Term> {BRACKET}, not a
          rule.
        </p>
        <div className="overflow-x-auto">
          <table>
            <caption>
              The {DECK_SIZE} cards besides your commander, bracket {BRACKET}
            </caption>
            <thead>
              <tr>
                <th scope="col">Slot</th>
                <th scope="col">What it does</th>
                <th scope="col" data-num>
                  Cards
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <Link href="/learn/how-many-lands">Lands</Link>
                </th>
                <td>Your mana, one land per turn</td>
                <td data-num className="text-foreground">
                  {TEMPLATE.lands}
                </td>
              </tr>
              {TEMPLATE_ROLES.map((role) => (
                <tr key={role}>
                  <th scope="row">
                    <Term id={ROLES[role].term}>{TEMPLATE_ROLE_LABELS[role]}</Term>
                  </th>
                  <td>{ROLES[role].does}</td>
                  <td data-num className="text-foreground">
                    {TEMPLATE.roles[role]}
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row">
                  Your theme
                </th>
                <td>Cards that work with your commander</td>
                <td data-num className="text-foreground">
                  {THEME}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Some cards fill two roles, like a removal spell that also draws a card. Each of those frees a slot for your
          theme. {SITE.name} builds toward these numbers: while you swipe, the deck counts every role and suggests
          more cards for the ones that are still short.
        </p>

        <h2>Step by step</h2>

        <h3>1. Pick a commander</h3>
        <p>
          Your <Term id="commander">commander</Term> is usually a legendary creature. It leads the deck and waits in the{" "}
          <Term id="command-zone">command zone</Term> until you cast it. Its{" "}
          <Term id="color-identity">color identity</Term>, the mana symbols on the card, decides which cards you can
          play. Pick one whose plan you like, since every other card is there to support it.
        </p>
        <p>
          No commander yet? The <Link href="/quiz">commander quiz</Link> suggests some from a few questions, and{" "}
          <Link href="/precons/find">find your precon</Link> does the same for ready-made decks.
        </p>

        <h3>2. Pick a bracket</h3>
        <p>
          Brackets rate how strong a deck is, from 1 to 5. For a first deck, bracket {BRACKET} (
          {BRACKET_INFO[BRACKET].name}) is a good place to start. Most <Term id="precon">precons</Term> fit it.{" "}
          <Link href="/learn/brackets">Commander brackets explained</Link> covers all five.
        </p>

        <h3>3. Fill the roles</h3>
        <p>
          Start with the lands, then the slots from the table, then your theme. A Commander deck is{" "}
          <Term id="singleton">singleton</Term>: one copy of each card, except basic lands. Every card also has to fit
          your commander&apos;s color identity. To set your exact land count, see{" "}
          <Link href="/learn/how-many-lands">how many lands you need</Link>.
        </p>

        <h3>4. Check the curve</h3>
        <p>
          The <Term id="mana-curve">mana curve</Term> shows how many of your spells cost 1, 2, 3 mana and so on. A
          curve that peaks at 2 and 3 gives you something to do on each of your first turns.
        </p>
        <figure className="panel-inset space-y-3 p-4">
          <Curve curve={TEMPLATE.curve} counts />
          <figcaption className="text-xs">
            A typical curve for the {SPELLS} spells of a bracket {BRACKET} deck. {MIDDLE} of them cost 2 to 4 mana,
            and the average mana value is about {curveAverage(TEMPLATE.curve).toFixed(1)}.
          </figcaption>
        </figure>

        <h3>5. Test it</h3>
        <p>
          Before your first game, <Term id="goldfish">goldfish</Term> the deck: play it alone for a few turns and see
          whether your opening hands have lands and something to cast. If a hand has too few lands, take a{" "}
          <Term id="mulligan">mulligan</Term> and draw a new one. The <Link href="/goldfish">goldfish table</Link>{" "}
          deals you a hand and lets you play turns on an empty table.
        </p>
      </LearnProse>
    </LearnArticle>
  );
}
