import type { Metadata } from "next";
import Link from "next/link";

import { EmptyCauldron } from "@/components/cauldron";
import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Term } from "@/components/learn/learn-prose";
import { PageHeader } from "@/components/page-header";
import { PreconBrowser, type BrowserPrecon } from "@/components/precons/precon-browser";
import { Button } from "@/components/ui/button";
import { canonical } from "@/lib/metadata";
import { isIndexedPrecon } from "@/lib/precons/slug";
import { listPrecons } from "@/lib/server/precons";
import { breadcrumbLd, itemListLd } from "@/lib/structured-data";

const PATH = "/precons";
const TITLE = "Commander precons: every deck and its decklist";
const DESCRIPTION =
  "Every preconstructed Commander deck by year, with a color filter. Open one to see its decklist, how it is built and where to start upgrading.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...canonical(PATH),
  openGraph: { ...canonical(PATH).openGraph, title: TITLE, description: DESCRIPTION },
};

export default async function PreconsPage() {
  const precons = await listPrecons();
  // Only what a tile and the search need, to keep the page payload small.
  const tiles: BrowserPrecon[] = precons.map(({ slug, name, set, releaseDate, commanders, colorIdentity, image }) => ({
    slug,
    name,
    set,
    releaseDate,
    commanders,
    colorIdentity,
    image,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Precons", path: PATH },
          ]),
          itemListLd(precons.filter(isIndexedPrecon).map((p) => ({ name: p.name, path: `${PATH}/${p.slug}` }))),
        ]}
      />

      <PageHeader
        title="Commander precons"
        description={
          <>
            A <Term id="precon">precon</Term> is a preconstructed Commander deck: 100 cards, ready to play out of the box.
            Here is every one so far, newest first.
          </>
        }
      />

      <section className="panel flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl leading-tight font-medium">Not sure which one?</h2>
          <p className="text-sm text-muted-foreground">Swipe through a few questions and get the decks that fit you.</p>
        </div>
        <Button className="shrink-0" nativeButton={false} render={<Link href="/precons/find" />}>
          Find your precon <ArrowRightIcon aria-hidden />
        </Button>
      </section>

      {tiles.length > 0 ? (
        <PreconBrowser precons={tiles} />
      ) : (
        <EmptyCauldron title="The precon list is not available" description="Please try again later." />
      )}
    </div>
  );
}
