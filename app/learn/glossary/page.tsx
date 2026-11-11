import type { Metadata } from "next";
import Link from "next/link";

import { ManaCost } from "@/components/card/mana";
import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { LearnArticle } from "@/components/learn/learn-article";
import { cardImageUrl } from "@/lib/cards/image";
import { learnPage } from "@/lib/learn";
import { DECK_STYLES } from "@/lib/learn-deck-styles";
import { GLOSSARY, GLOSSARY_GROUPS, glossaryEntries, splitManaText, type GlossaryEntry } from "@/lib/learn-glossary";
import { canonical } from "@/lib/metadata";
import { definedTermSetLd } from "@/lib/structured-data";

const page = learnPage("/learn/glossary");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  ...canonical(page.path),
};

export default function GlossaryPage() {
  return (
    <LearnArticle
      path={page.path}
      lead="The words you will hear at a Commander table, each in a sentence or two, from how the format works to playing a game."
    >
      <JsonLd
        data={definedTermSetLd({
          name: page.title,
          path: page.path,
          terms: [
            ...GLOSSARY.map((entry) => ({ id: entry.id, name: entry.term, description: entry.text })),
            ...DECK_STYLES.map((style) => ({ id: style.id, name: style.term, description: style.text })),
          ],
        })}
      />

      <nav aria-label="All terms">
        <ul className="flex flex-wrap gap-x-3">
          {GLOSSARY.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="ui-label inline-flex min-h-9 items-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {entry.term}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#group-styles"
              className="ui-label inline-flex min-h-9 items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              Deck styles
            </a>
          </li>
        </ul>
      </nav>

      {GLOSSARY_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-3">
          <h2 id={`group-${group.id}`} className="scroll-mt-20 text-2xl leading-tight font-medium">
            {group.title}
          </h2>
          <dl className="panel divide-y divide-border/60 p-1">
            {glossaryEntries(group.id).map((entry) => (
              <GlossaryItem key={entry.id} entry={entry} />
            ))}
          </dl>
        </section>
      ))}

      <section aria-labelledby="group-styles" className="space-y-3">
        <h2 id="group-styles" className="scroll-mt-20 text-2xl leading-tight font-medium">
          Deck styles
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
          The labels on a <Link href="/precons" className="text-foreground underline decoration-brand/60 underline-offset-2 hover:text-brand">precon page</Link>{" "}
          say what the deck is built to do.
        </p>
        <dl className="panel divide-y divide-border/60 p-1">
          {DECK_STYLES.map((style) => (
            <div key={style.id} id={style.id} className="scroll-mt-20 space-y-1.5 rounded-md px-3 py-4 target:ring-1 target:ring-brand/60 sm:px-4">
              <dt>
                <a href={`#${style.id}`} className="font-heading text-xl leading-tight font-medium text-foreground hover:text-brand">
                  {style.term}
                </a>
              </dt>
              <dd className="text-[0.9375rem] leading-relaxed text-muted-foreground">{style.text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </LearnArticle>
  );
}

function GlossaryItem({ entry }: { entry: GlossaryEntry }) {
  return (
    <div
      id={entry.id}
      className="grid scroll-mt-20 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 rounded-md px-3 py-4 target:ring-1 target:ring-brand/60 sm:px-4"
    >
      <dt className="col-start-1 flex flex-wrap items-baseline gap-x-2">
        <a href={`#${entry.id}`} className="font-heading text-xl leading-tight font-medium text-foreground hover:text-brand">
          {entry.term}
        </a>
        {entry.aka && <span className="text-xs text-muted-foreground">also {entry.aka}</span>}
      </dt>
      <dd className="col-start-1 text-[0.9375rem] leading-relaxed text-muted-foreground">
        <ManaText text={entry.text} />
        {entry.more && (
          <Link
            href={entry.more.href}
            className="ui-label mt-1 flex w-fit min-h-8 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {entry.more.label} <ArrowRightIcon className="size-3.5 shrink-0" aria-hidden />
          </Link>
        )}
      </dd>
      {entry.example && (
        <dd className="col-start-2 row-span-2 row-start-1 w-16 space-y-1 sm:w-20">
          {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
          <img
            src={cardImageUrl(entry.example.image, "small")}
            alt={entry.example.name}
            loading="lazy"
            decoding="async"
            className="card-aspect w-full rounded-[4.75%] shadow-md ring-1 ring-black/60"
          />
          <p aria-hidden="true" className="text-center text-[0.6875rem] leading-tight text-muted-foreground">
            {entry.example.name}
          </p>
        </dd>
      )}
    </div>
  );
}

/** Text with `{2}{G}`-style runs drawn as mana symbols. */
function ManaText({ text }: { text: string }) {
  return splitManaText(text).map((part, i) =>
    part.mana ? <ManaCost key={i} cost={part.text} className="mx-px align-[-0.15em]" /> : part.text,
  );
}
