import type { Metadata } from "next";
import Link from "next/link";

import { ManaSymbol } from "@/components/card/mana";
import { LearnArticle } from "@/components/learn/learn-article";
import { LearnProse, Term } from "@/components/learn/learn-prose";
import { COLORS, COLOR_NAMES, identityName, sortColors } from "@/lib/cards/colors";
import type { Color } from "@/lib/cards/types";
import { learnPage } from "@/lib/learn";
import { canonical } from "@/lib/metadata";
import { identityKey } from "@/lib/precons/slug";
import { preconCountsByIdentity } from "@/lib/server/precons";

const page = learnPage("/learn/color-combinations");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

interface Identity {
  /** Mana symbols in the order the name is usually written, e.g. "GW" for Selesnya. */
  colors: string;
  /** Where the name comes from, in a few words. */
  origin: string;
}

const MONO: Identity[] = COLORS.map((color) => ({ colors: color, origin: `${COLOR_NAMES[color]} only` }));

const ALLIED_PAIRS: Identity[] = [
  { colors: "WU", origin: "Ravnica's guild of lawmakers" },
  { colors: "UB", origin: "Ravnica's guild of spies" },
  { colors: "BR", origin: "Ravnica's guild of performers" },
  { colors: "RG", origin: "Ravnica's guild of wild clans" },
  { colors: "GW", origin: "Ravnica's guild of nature" },
];

const ENEMY_PAIRS: Identity[] = [
  { colors: "WB", origin: "Ravnica's guild of priests and bankers" },
  { colors: "UR", origin: "Ravnica's guild of inventors" },
  { colors: "BG", origin: "Ravnica's guild of rot and regrowth" },
  { colors: "RW", origin: "Ravnica's guild of soldiers" },
  { colors: "GU", origin: "Ravnica's guild of biologists" },
];

const SHARDS: Identity[] = [
  { colors: "GWU", origin: "Alara's shard of knights" },
  { colors: "WUB", origin: "Alara's shard of mages and metal" },
  { colors: "UBR", origin: "Alara's shard of the undead" },
  { colors: "BRG", origin: "Alara's shard of dragons" },
  { colors: "RGW", origin: "Alara's shard of giant beasts" },
];

const WEDGES: Identity[] = [
  { colors: "WBG", origin: "Tarkir's clan of endurance" },
  { colors: "URW", origin: "Tarkir's clan of cunning" },
  { colors: "BGU", origin: "Tarkir's clan of ruthlessness" },
  { colors: "RWB", origin: "Tarkir's clan of speed" },
  { colors: "GUR", origin: "Tarkir's clan of savagery" },
];

const FOUR_COLORS: Identity[] = COLORS.map((missing, i) => {
  // Written starting after the missing color, as on the Nephilim: Glint-Eye is UBRG, Dune-Brood BRGW.
  const ordered = [...COLORS.slice(i + 1), ...COLORS.slice(0, i)];
  return { colors: ordered.join(""), origin: `Everything but ${COLOR_NAMES[missing].toLowerCase()}` };
});

const FIVE_COLORS: Identity[] = [{ colors: "WUBRG", origin: "All five colors, also called WUBRG" }];
const COLORLESS: Identity[] = [{ colors: "", origin: "No colored mana symbols at all" }];

function lettersOf(identity: Identity): Color[] {
  return sortColors([...identity.colors]);
}

/** The anchor of an identity: its name in lower case, e.g. "golgari", "mono-black", "five-color". */
function anchorOf(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function IdentityEntry({ identity, precons }: { identity: Identity; precons: Record<string, number> }) {
  const colors = lettersOf(identity);
  const name = identityName(colors);
  const key = identityKey(colors);
  const count = precons[key] ?? 0;
  const symbols = identity.colors ? [...identity.colors] : ["C"];
  return (
    <div id={anchorOf(name)} className="panel-inset relative flex h-full scroll-mt-20 flex-col gap-1.5 p-3">
      <span className="flex gap-0.5" aria-hidden="true">
        {symbols.map((symbol) => (
          <ManaSymbol key={symbol} symbol={symbol} className="size-5" />
        ))}
      </span>
      <span className="font-heading text-lg leading-tight font-medium text-foreground">{name}</span>
      <span className="text-xs leading-snug">{identity.origin}</span>
      <span className="mt-auto pt-1 text-xs">
        {count > 0 ? (
          // Exactly this identity; colorless has no letters, so its filter value is "c".
          // The whole card is the tap target; screen readers hear "6 Golgari precons".
          <Link href={`/precons?identity=${key ? key.toLowerCase() : "c"}`} className="after:absolute after:inset-0 after:rounded-xl">
            {count} <span className="sr-only">{name} </span>
            {count === 1 ? "precon" : "precons"}
          </Link>
        ) : (
          "No precons"
        )}
      </span>
    </div>
  );
}

/** A grid of identities; divs with list roles, since the prose styles give every `ul` bullets. */
function IdentityGrid({ identities, precons, label }: { identities: Identity[]; precons: Record<string, number>; label: string }) {
  return (
    <div role="list" aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {identities.map((identity) => (
        <div role="listitem" key={identity.colors || "C"}>
          <IdentityEntry identity={identity} precons={precons} />
        </div>
      ))}
    </div>
  );
}

/** Points of the color wheel on a circle, white at the top and then clockwise, in a 100 × 100 box. */
const WHEEL = COLORS.map((color, i) => {
  const angle = ((-90 + i * 72) * Math.PI) / 180;
  return { color, x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
});

/** The five colors on their wheel: neighbors (allies) joined by solid lines, opposites (enemies) by dashed ones. */
function ColorWheel() {
  const point = (i: number) => WHEEL[(i + WHEEL.length) % WHEEL.length];
  return (
    <div
      role="img"
      aria-label="The color wheel: white, blue, black, red and green in a circle. Each color is allied with its two neighbors and an enemy of the two colors across from it."
      className="relative mx-auto size-40 shrink-0 sm:mx-0"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        {WHEEL.map((_, i) => (
          <line
            key={`ally-${i}`}
            x1={point(i).x}
            y1={point(i).y}
            x2={point(i + 1).x}
            y2={point(i + 1).y}
            className="stroke-foreground/50"
            strokeWidth={1}
          />
        ))}
        {WHEEL.map((_, i) => (
          <line
            key={`enemy-${i}`}
            x1={point(i).x}
            y1={point(i).y}
            x2={point(i + 2).x}
            y2={point(i + 2).y}
            className="stroke-muted-foreground/50"
            strokeWidth={0.75}
            strokeDasharray="2.5 2"
          />
        ))}
      </svg>
      {WHEEL.map(({ color, x, y }) => (
        <span
          key={color}
          className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <ManaSymbol symbol={color} className="size-7" />
        </span>
      ))}
    </div>
  );
}

export default async function ColorCombinationsPage() {
  const precons = await preconCountsByIdentity();

  return (
    <LearnArticle
      path={page.path}
      lead={
        <>
          Two-color pairs are called guilds, after the ten guilds of the city-plane Ravnica, such as Azorius for white and
          blue. Three-color groups are shards (a color and its two neighbors) or wedges (a color and its two opposites),
          named after the planes Alara and Tarkir.
        </>
      }
      next={{
        title: "Which colors suit you?",
        text: "Answer a few questions by swiping and see which colors match how you like to play.",
        href: "/quiz/colors",
        label: "Take the color quiz",
      }}
    >
      <LearnProse aria-labelledby="color-wheel">
        <h2 id="color-wheel">The color wheel</h2>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <ColorWheel />
          <div className="space-y-3">
            <p>
              Magic has five colors, always written in the same order: white, blue, black, red and green, or WUBRG for
              short (U is blue, because B is black). On the wheel, the two colors next to a color are its allies and the
              two across from it are its enemies.
            </p>
            <p>
              In Commander, the mana symbols on your commander set your deck&apos;s{" "}
              <Term id="color-identity">color identity</Term>: every card in the deck has to fit inside those colors.
              The names below are how players talk about these identities.
            </p>
          </div>
        </div>
      </LearnProse>

      <LearnProse aria-labelledby="one-color">
        <h2 id="one-color">One color</h2>
        <p>A deck of one color is called mono-white, mono-blue and so on.</p>
        <IdentityGrid identities={MONO} precons={precons} label="One color" />
      </LearnProse>

      <LearnProse aria-labelledby="two-colors">
        <h2 id="two-colors">Two colors (guilds)</h2>
        <p>
          Each pair is named after one of the ten guilds of Ravnica, a city-plane where every guild stands for two
          colors. Five pairs are allies and five are enemies.
        </p>
        <h3>Allied pairs</h3>
        <IdentityGrid identities={ALLIED_PAIRS} precons={precons} label="Allied pairs" />
        <h3>Enemy pairs</h3>
        <IdentityGrid identities={ENEMY_PAIRS} precons={precons} label="Enemy pairs" />
      </LearnProse>

      <LearnProse aria-labelledby="three-colors">
        <h2 id="three-colors">Three colors (shards and wedges)</h2>
        <h3>Shards</h3>
        <p>A shard is a color and its two allies, named after the five shards of the plane Alara.</p>
        <IdentityGrid identities={SHARDS} precons={precons} label="Shards" />
        <h3>Wedges</h3>
        <p>A wedge is a color and its two enemies, named after the five clans of the plane Tarkir.</p>
        <IdentityGrid identities={WEDGES} precons={precons} label="Wedges" />
      </LearnProse>

      <LearnProse aria-labelledby="four-colors">
        <h2 id="four-colors">Four colors</h2>
        <p>
          Four-color mixes have no official names. Players borrowed the names of the five Nephilim from the set Guildpact,
          one creature for each four-color mix. Many people simply say which color is missing, as in &ldquo;non-white&rdquo;.
        </p>
        <IdentityGrid identities={FOUR_COLORS} precons={precons} label="Four colors" />
      </LearnProse>

      <LearnProse aria-labelledby="five-and-colorless">
        <h2 id="five-and-colorless">Five colors and colorless</h2>
        <p>
          A five-color deck can play any card. A colorless commander, such as many of the Eldrazi, allows only cards
          without colored mana symbols, and Wastes as its only basic land.
        </p>
        <IdentityGrid identities={[...FIVE_COLORS, ...COLORLESS]} precons={precons} label="Five colors and colorless" />
      </LearnProse>
    </LearnArticle>
  );
}
