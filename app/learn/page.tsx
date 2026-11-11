import type { Metadata } from "next";
import Link from "next/link";

import { ManaSymbol } from "@/components/card/mana";
import { ArrowRightIcon, HeartIcon, PackageIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { COLORS } from "@/lib/cards/colors";
import { LEARN_HUB, learnPage, type LearnPath } from "@/lib/learn";
import { canonical } from "@/lib/metadata";
import { breadcrumbLd, itemListLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: LEARN_HUB.title,
  description: LEARN_HUB.description,
  ...canonical(LEARN_HUB.path),
};

/** The guides in the order someone new to the format needs them: play a game, then understand decks, then build one. */
const READING_ORDER: LearnPath[] = [
  "/learn/how-to-play-commander",
  "/learn/color-combinations",
  "/learn/brackets",
  "/learn/how-to-build-a-commander-deck",
  "/learn/how-many-lands",
  "/learn/glossary",
];

const GUIDES = READING_ORDER.map(learnPage);

function ColorsMark() {
  return (
    <span className="flex -space-x-1" aria-hidden="true">
      {COLORS.map((color) => (
        <ManaSymbol key={color} symbol={color} className="size-4 rounded-full ring-2 ring-card" />
      ))}
    </span>
  );
}

const TRY_IT = [
  { href: "/quiz/colors", question: "Not sure which colors you like?", action: "Take the color quiz", mark: <ColorsMark /> },
  {
    href: "/precons/find",
    question: "Want a deck that is ready to play?",
    action: "Find your precon",
    mark: <PackageIcon className="size-5 text-muted-foreground" aria-hidden />,
  },
  {
    href: "/quiz",
    question: "Looking for a commander?",
    action: "Take the commander quiz",
    mark: <HeartIcon className="size-5 text-muted-foreground" aria-hidden />,
  },
];

export default function LearnHubPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10 sm:py-14">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Learn", path: LEARN_HUB.path },
          ]),
          itemListLd(GUIDES.map((guide) => ({ name: guide.title, path: guide.path }))),
        ]}
      />

      <header className="space-y-3 border-b border-border pb-5">
        <h1 className="text-4xl leading-none font-medium break-words sm:text-5xl">{LEARN_HUB.title}</h1>
        <p className="max-w-2xl text-[0.9375rem] text-muted-foreground">
          Six short guides, in the order you will need them, from your first game to your first deck.
        </p>
      </header>

      <ol className="space-y-3" aria-label="Guides">
        {GUIDES.map((guide, i) => (
          <li key={guide.path}>
            <Link
              href={guide.path}
              className="group panel flex items-start gap-4 p-4 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70 sm:p-5"
            >
              <span className="numeral w-6 shrink-0 pt-0.5 text-2xl text-muted-foreground" aria-hidden="true">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-heading text-xl leading-tight font-medium">{guide.title}</span>
                <span className="block text-sm text-muted-foreground">{guide.description}</span>
              </span>
              <ArrowRightIcon
                className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ol>

      <section aria-labelledby="try-it" className="space-y-3">
        <h2 id="try-it" className="text-2xl font-medium">
          Try it with real cards
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TRY_IT.map(({ href, question, action, mark }) => (
            <Link
              key={href}
              href={href}
              className="group panel flex flex-col gap-3 p-4 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-brand/70"
            >
              <span className="flex h-5 items-center">{mark}</span>
              <span className="space-y-0.5">
                <span className="block text-sm text-muted-foreground">{question}</span>
                <span className="flex items-center justify-between gap-2 font-heading text-lg leading-tight font-medium">
                  {action}
                  <ArrowRightIcon
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
