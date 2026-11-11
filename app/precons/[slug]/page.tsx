import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ColorIdentity } from "@/components/card/mana";
import { JsonLd } from "@/components/json-ld";
import { Term } from "@/components/learn/learn-prose";
import { Curve, RoleBar } from "@/components/learn/visuals";
import { ExternalLink } from "@/components/legal/prose";
import { PreconActions } from "@/components/precons/precon-actions";
import { PreconDecklist } from "@/components/precons/precon-decklist";
import { PreconTileGrid } from "@/components/precons/precon-tile";
import { CheckCircleIcon, InfoIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { identityName } from "@/lib/cards/colors";
import { cardImageUrl } from "@/lib/cards/image";
import { formatLearnDate, type GlossaryTermId } from "@/lib/learn";
import { deckStyleLink } from "@/lib/learn-deck-styles";
import { canonical } from "@/lib/metadata";
import type { AnalysisRole, PreconAnalysis, PreconCommander } from "@/lib/precons/analysis";
import {
  colorWords,
  commanderNames,
  landLine,
  preconDescription,
  preconTitle,
  printedBracket,
  ROLE_NAMES,
  ROLE_WHY,
  thinRoles,
  type BracketReason,
} from "@/lib/precons/page-text";
import { identityKey, isIndexedPrecon, isUrlSafeSlug } from "@/lib/precons/slug";
import { listPrecons, loadPreconPage, type PreconPage } from "@/lib/server/precons";
import { SITE } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

/** Slug for the single placeholder page when the generated data is missing; it renders the 404. */
const NO_DATA_SLUG = "unavailable";

/** At most this many tiles in "More from <set>": Secret Lair has many decks under one code. */
const MAX_SAME_SET = 8;

const ROLE_TERMS: Record<AnalysisRole, GlossaryTermId> = {
  ramp: "ramp",
  draw: "card-draw",
  interaction: "interaction",
  boardwipe: "board-wipe",
  protection: "protection",
};

export async function generateStaticParams() {
  const precons = await listPrecons();
  // Cache Components needs at least one entry; without data that one renders the 404.
  return precons.length ? precons.map((p) => ({ slug: p.slug })) : [{ slug: NO_DATA_SLUG }];
}

/** The page data for a slug from the URL, without touching the cache for anything that cannot be a slug. */
async function pageFor(slug: string): Promise<PreconPage | null> {
  if (slug.length > 120 || !isUrlSafeSlug(slug)) return null;
  return loadPreconPage(slug);
}

/** The day the precon data was generated, as an ISO date, or null when unknown. */
async function dataDate(): Promise<string | null> {
  "use cache";
  cacheLife("max");
  try {
    const meta = JSON.parse(await readFile(path.join(process.cwd(), "data/precons-meta.json"), "utf8")) as { generatedAt?: unknown };
    const day = typeof meta.generatedAt === "string" ? meta.generatedAt.slice(0, 10) : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/precons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await pageFor(slug);
  if (!page) return { title: "Precon not found", robots: { index: false, follow: true } };

  const { summary, analysis } = page;
  const title = preconTitle(summary.name);
  const description = preconDescription(summary, analysis);
  const base = canonical(`/precons/${summary.slug}`);
  return {
    title,
    description,
    ...base,
    openGraph: { ...base.openGraph, title, description },
    twitter: { card: "summary_large_image", title, description },
    // Older precons are reachable but not indexed yet; their links still count.
    ...(isIndexedPrecon(summary) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function PreconDetailPage({ params }: PageProps<"/precons/[slug]">) {
  const { slug } = await params;
  const page = await pageFor(slug);
  if (!page) notFound();
  const date = await dataDate();
  return <PreconView page={page} dataDate={date} />;
}

function PreconView({ page, dataDate }: { page: PreconPage; dataDate: string | null }) {
  const { summary, analysis, themes } = page;
  const path = `/precons/${summary.slug}`;
  const sameSet = page.sameSet.slice(0, MAX_SAME_SET);
  const identity = identityName(analysis.colorIdentity);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Precons", path: "/precons" },
          { name: summary.name, path },
        ])}
      />

      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="ui-label flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <li className="shrink-0">
            <Link href="/precons" className="hover:text-foreground">
              Precons
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            /
          </li>
          <li aria-current="page" className="truncate">
            {summary.name}
          </li>
        </ol>
      </nav>

      <section className="panel grid gap-6 p-4 sm:p-6 md:grid-cols-[260px_1fr]">
        <CommanderCards commanders={analysis.commanders} />
        <div className="flex min-w-0 flex-col gap-5">
          <div className="space-y-1">
            <p className="ui-label text-muted-foreground">
              Commander <Term id="precon">precon</Term> · {summary.releaseDate.slice(0, 4)}
            </p>
            <h1 className="text-3xl leading-tight font-medium break-words md:text-4xl">{summary.name}</h1>
            <p className="text-[0.9375rem] text-muted-foreground">
              Led by {commanderNames(analysis.commanders.map((c) => c.name))}
            </p>
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <ColorIdentity colors={analysis.colorIdentity} />
            <Link
              href="/learn/color-combinations"
              className="underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 transition-colors hover:text-brand"
            >
              {identity}
            </Link>
            {analysis.colorIdentity.length > 1 && (
              <span className="text-muted-foreground">· {colorWords(analysis.colorIdentity)}</span>
            )}
          </p>

          {themes.length > 0 && (
            <div className="space-y-2">
              <h2 className="ui-label text-muted-foreground">What it does</h2>
              <ul className="flex flex-wrap gap-1.5">
                {themes.map((theme) => {
                  // Each label links to its explanation in the glossary, with the dotted underline of a `Term`; the tooltip shows it on hover.
                  const style = deckStyleLink(theme.id);
                  return (
                    <li key={theme.id}>
                      {style ? (
                        <Badge
                          variant="secondary"
                          className="underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 max-sm:h-8 max-sm:px-2.5"
                          render={<Link href={style.href} title={style.text ?? undefined} />}
                        >
                          {theme.label}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{theme.label}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-auto space-y-2">
            <PreconActions precon={{ id: summary.id, name: summary.name }} canUpgrade={analysis.canUpgrade} />
            <p className="text-xs text-muted-foreground">Both keep a copy of the deck in this browser. No account needed.</p>
          </div>
        </div>
      </section>

      <HowItsBuilt analysis={analysis} />

      <div className="grid gap-6 md:grid-cols-2">
        <BracketPanel analysis={analysis} />
        <UpgradePanel analysis={analysis} />
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-medium">Decklist</h2>
          <p className="text-sm text-muted-foreground">
            {analysis.deckSize} cards as printed, lowest mana value first in each group.
            {analysis.gameChangers.length > 0 && (
              <>
                {" "}
                <span className="text-brand">Highlighted</span> cards are{" "}
                <Term id="game-changer">Game Changers</Term>.
              </>
            )}
          </p>
        </div>
        <PreconDecklist commanders={analysis.commanders} groups={analysis.groups} />
        {analysis.missing.length > 0 && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Also in the printed deck, but missing from the card data here: {analysis.missing.join(", ")}.
            </span>
          </p>
        )}
      </section>

      {sameSet.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-medium">From the same release</h2>
          <PreconTileGrid precons={sameSet} />
        </section>
      )}

      {page.sameColors.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-2xl font-medium">
              More {analysis.colorIdentity.length ? identity : "colorless"} precons
            </h2>
            {analysis.colorIdentity.length > 0 && (
              <Link
                href={`/precons?colors=${identityKey(analysis.colorIdentity).toLowerCase()}`}
                className="ui-label inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground"
              >
                All decks with these colors
              </Link>
            )}
          </div>
          <PreconTileGrid precons={page.sameColors} />
        </section>
      )}

      <p className="border-t border-border pt-5 text-xs text-muted-foreground">
        Card data from <ExternalLink href="https://scryfall.com">Scryfall</ExternalLink>, decklists from{" "}
        <ExternalLink href="https://mtgjson.com">MTGJSON</ExternalLink>. Counts and comparisons are worked out by {SITE.name}
        {dataDate ? (
          <>
            {" "}
            from data of <time dateTime={dataDate}>{formatLearnDate(dataDate)}</time>.
          </>
        ) : (
          "."
        )}
      </p>
    </div>
  );
}

/** The commander, or both partners side by side, as printed cards. */
function CommanderCards({ commanders }: { commanders: PreconCommander[] }) {
  const pair = commanders.length > 1;
  return (
    <div className={cn("mx-auto", pair ? "grid w-full max-w-sm grid-cols-2 gap-3 md:max-w-none md:grid-cols-1" : "w-48 sm:w-56 md:w-full")}>
      {commanders.map((commander, i) =>
        commander.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images
          <img
            key={commander.name}
            src={cardImageUrl(commander.image, "normal")}
            alt={commander.name}
            loading={i === 0 ? "eager" : "lazy"}
            className="card-aspect w-full rounded-[4.75%] shadow-lg ring-1 ring-black/60"
          />
        ) : (
          <div
            key={commander.name}
            className="card-aspect panel-inset flex w-full items-center justify-center rounded-[4.75%] p-3 text-center font-heading text-lg font-medium"
          >
            {commander.name}
          </div>
        ),
      )}
    </div>
  );
}

function HowItsBuilt({ analysis }: { analysis: PreconAnalysis }) {
  const lands = landLine(analysis.landAdvice);
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-medium">How it&apos;s built</h2>
      <div className="panel space-y-6 p-4 sm:p-6">
        <dl className="panel-inset grid grid-cols-3 [&>div]:border-border [&>div:nth-child(3n+2)]:border-x">
          <div className="flex flex-col-reverse justify-end gap-1 px-3 py-3 sm:px-4">
            <dt className="text-xs leading-tight text-muted-foreground">Lands</dt>
            <dd className="numeral text-2xl">{analysis.lands}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end gap-1 px-3 py-3 sm:px-4">
            <dt className="text-xs leading-tight text-muted-foreground">
              Average <Term id="mana-value">mana value</Term>
            </dt>
            <dd className="numeral text-2xl">{analysis.averageManaValue.toFixed(2)}</dd>
          </div>
          <div className="flex flex-col-reverse justify-end gap-1 px-3 py-3 sm:px-4">
            <dt className="text-xs leading-tight text-muted-foreground">
              <Term id="game-changer">Game Changers</Term>
            </dt>
            <dd className={cn("numeral text-2xl", analysis.gameChangers.length > 0 && "text-brand")}>{analysis.gameChangers.length}</dd>
          </div>
        </dl>

        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div className="space-y-3">
            <h3 className="ui-label text-muted-foreground">Cards by role</h3>
            <div className="space-y-2.5">
              {analysis.roles.map((role) => (
                <RoleBar
                  key={role.role}
                  label={<Term id={ROLE_TERMS[role.role]}>{ROLE_NAMES[role.role]}</Term>}
                  have={role.have}
                  target={role.target}
                  quiet
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">The second number is the usual count in a casual (Core) deck.</p>
          </div>
          <div className="space-y-3">
            <h3 className="ui-label text-muted-foreground">
              <Term id="mana-curve">Mana curve</Term>
            </h3>
            <Curve curve={analysis.curve} counts />
            <p className="text-xs text-muted-foreground">Nonland cards by mana value.</p>
          </div>
        </div>

        {lands && (
          <p className="text-sm">
            {lands.before}
            <Link href="/learn/how-many-lands" className="text-brand underline underline-offset-4">
              {lands.link}
            </Link>
            {lands.after}
          </p>
        )}
      </div>
    </section>
  );
}

function reasonText(reason: BracketReason): React.ReactNode {
  switch (reason.kind) {
    case "game-changers":
      return (
        <>
          {reason.names.length} <Term id="game-changer">{reason.names.length === 1 ? "Game Changer" : "Game Changers"}</Term>:{" "}
          {reason.names.join(", ")}. Core allows none.
        </>
      );
    case "mass-land-denial":
      return <>Mass land denial: {reason.names.join(", ")}. Core allows none.</>;
  }
}

function BracketPanel({ analysis }: { analysis: PreconAnalysis }) {
  const printed = printedBracket(analysis);
  return (
    <section className="panel flex flex-col gap-3 p-5">
      <h2 className="font-heading text-xl leading-tight font-medium">
        <Term id="bracket">Bracket</Term>
      </h2>
      {printed.reasons.length === 0 ? (
        <p className="flex items-start gap-2 text-sm">
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-pick" aria-hidden />
          Fits Core (bracket 2).
        </p>
      ) : (
        <div className="space-y-2 text-sm">
          <p>This list goes past the limits of Core (bracket 2):</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {printed.reasons.map((reason) => (
              <li key={reason.kind}>{reasonText(reason)}</li>
            ))}
          </ul>
          <p>
            By the rules, the printed list lands in {printed.name} (bracket {printed.bracket}).
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Two-card combos are not checked here.{" "}
        <Link href="/learn/brackets" className="underline underline-offset-2 hover:text-foreground">
          Commander brackets explained
        </Link>
      </p>
    </section>
  );
}

function UpgradePanel({ analysis }: { analysis: PreconAnalysis }) {
  const thin = thinRoles(analysis);
  return (
    <section className="panel flex flex-col gap-3 p-5">
      <h2 className="font-heading text-xl leading-tight font-medium">Where to start upgrading</h2>
      {thin.length > 0 ? (
        <ul className="space-y-2.5 text-sm">
          {thin.map((role) => (
            <li key={role.role} className="space-y-0.5">
              <p>
                <Term id={ROLE_TERMS[role.role]}>{role.name}</Term>
                {role.rest}
              </p>
              <p className="text-xs text-muted-foreground">{ROLE_WHY[role.role]}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">
          Every role is at or above the usual count, so upgrades come down to stronger cards and your own taste.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Counted from this list against a casual (Core) deck.{" "}
        <Link href="/learn/how-to-build-a-commander-deck" className="underline underline-offset-2 hover:text-foreground">
          How to build a Commander deck
        </Link>
      </p>
    </section>
  );
}
