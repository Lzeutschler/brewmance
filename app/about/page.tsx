import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon, ArrowUpRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { ExternalLink, Prose } from "@/components/legal/prose";
import { Button } from "@/components/ui/button";
import { canonical } from "@/lib/metadata";
import { FEEDBACK, SITE } from "@/lib/site";
import { personLd } from "@/lib/structured-data";
import portrait from "@/public/about/leonard-zeutschler.jpg";

export const metadata: Metadata = {
  title: "About",
  description:
    `${SITE.name} is built by Leonard Zeutschler, a full-stack developer and AI engineer from the Ruhr area, Germany.`,
  ...canonical("/about"),
};

const LINKS = [
  { label: "Website", href: "https://www.leonard-zeutschler.de/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/leonard-zeutschler-aaa951201/" },
  { label: "GitHub", href: "https://github.com/Lzeutschler" },
];

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <JsonLd data={personLd({ sameAs: LINKS.map((link) => link.href) })} />
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <Image
          src={portrait}
          alt="Portrait of Leonard Zeutschler"
          placeholder="blur"
          priority
          sizes="160px"
          className="size-36 shrink-0 rotate-[-3deg] rounded-xl border-[5px] border-ink object-cover object-top shadow-xl ring-1 ring-border sm:size-40"
        />
        <div className="space-y-3">
          <h1 className="text-4xl leading-none font-medium sm:text-5xl">Hi, I&apos;m Leonard</h1>
          <p className="text-muted-foreground">
            Full-stack developer and AI engineer from the Ruhr area, Germany — and the person behind {SITE.name}.
          </p>
          <ul className="flex flex-wrap justify-center gap-2 sm:justify-start" aria-label="Leonard on the web">
            {LINKS.map(({ label, href }) => (
              <li key={href}>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href={href} target="_blank" rel="noreferrer" />}
                >
                  {label} <ArrowUpRightIcon aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <Prose aria-labelledby="about-me">
        <h2 id="about-me">About me</h2>
        <p>
          By day I&apos;m a Technical Consultant at <ExternalLink href="https://cyberium.de/">CYBERIUM</ExternalLink>; I
          also co-founded <ExternalLink href="https://45level.com/">45level</ExternalLink>, where I&apos;m Lead AI
          Engineer. I mostly build with Next.js, React, TypeScript and Python, and I spend a lot of time with AI agents.
          Nothing makes me happier than taking a cool idea and actually bringing it to life.
        </p>

        <h2>Why {SITE.name}?</h2>
        <p>
          I&apos;ve been playing Commander for a few months now. <ExternalLink href="https://edhrec.com">EDHREC</ExternalLink>{" "}
          is my favourite place for inspiration, but scrolling through hundreds of suggestions is not the most fun way
          to build a deck. Swiping is. And whenever I wanted to goldfish a new list, the existing sites felt clunky.
        </p>
        <p>
          So I built the tool I wanted myself: pick a commander and a power level, swipe through cards that fit while
          the deck stays playable, then test it in an Arena-style sandbox. It&apos;s free, needs no account and keeps
          your decks in your browser.
        </p>
        <p>
          Found a bug or have an idea? Write to <a href={`mailto:${FEEDBACK.email}`}>{FEEDBACK.email}</a>.
        </p>
        <div className="pt-2">
          <Button nativeButton={false} render={<Link href="/build" />}>
            Start building <ArrowRightIcon aria-hidden />
          </Button>
        </div>
      </Prose>

      <Prose aria-labelledby="credits">
        <h2 id="credits">Credits &amp; legal</h2>
        <ul>
          <li>
            Card data, card images and mana symbols by <ExternalLink href="https://scryfall.com">Scryfall</ExternalLink>
            , following its{" "}
            <ExternalLink href="https://scryfall.com/docs/api/images">image guidelines</ExternalLink>.
          </li>
          <li>
            Card suggestions based on data from <ExternalLink href="https://edhrec.com">EDHREC</ExternalLink>.{" "}
            {SITE.name} is not affiliated with EDHREC or Scryfall.
          </li>
          <li>
            Precon deck lists from <ExternalLink href="https://mtgjson.com">MTGJSON</ExternalLink> (MIT license).
          </li>
          <li>
            Tap and card type symbols from the <ExternalLink href="https://mana.andrewgioia.com">Mana</ExternalLink> font
            by Andrew Gioia; Alegreya and Archivo typefaces and{" "}
            <ExternalLink href="https://phosphoricons.com">Phosphor</ExternalLink> icons. All under the SIL Open Font
            License or MIT.
          </li>
          <li>
            {SITE.name} is unofficial Fan Content permitted under the{" "}
            <ExternalLink href="https://company.wizards.com/en/legal/fancontentpolicy">Fan Content Policy</ExternalLink>.
            Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast.
            ©Wizards of the Coast LLC.
          </li>
        </ul>
        <p>
          <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Privacy policy</Link>
        </p>
      </Prose>
    </article>
  );
}
