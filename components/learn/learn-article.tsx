import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { LEARN_GUIDES, LEARN_HUB, formatLearnDate, learnPage, type LearnPath } from "@/lib/learn";
import { OPERATOR } from "@/lib/site";
import { articleLd, breadcrumbLd, itemListLd } from "@/lib/structured-data";

export interface NextStep {
  /** A short heading, e.g. "Build your first deck". */
  title: string;
  /** One line under the heading. */
  text?: string;
  href: string;
  /** The button label. */
  label: string;
}

/**
 * Frame for a page under /learn: breadcrumb, title, lead, byline, the page's own content, an optional next step
 * and links to the other guides. Title, description and date come from the registry in lib/learn.ts, and the
 * page's breadcrumb and article (or, on the hub, the list of guides) go out as JSON-LD.
 */
export function LearnArticle({
  path,
  lead,
  next,
  children,
}: {
  path: LearnPath;
  /** The line under the title; defaults to the page's description. */
  lead?: React.ReactNode;
  next?: NextStep;
  children: React.ReactNode;
}) {
  const page = learnPage(path);
  const isHub = path === LEARN_HUB.path;
  const trail = [
    { name: "Home", path: "/" },
    { name: "Learn", path: LEARN_HUB.path },
    ...(isHub ? [] : [{ name: page.title, path: page.path }]),
  ];
  // The hub lists the guides itself.
  const others = isHub ? [] : [LEARN_HUB, ...LEARN_GUIDES.filter((guide) => guide.path !== path)];

  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <JsonLd
        data={[
          breadcrumbLd(trail),
          isHub
            ? itemListLd(LEARN_GUIDES.map((guide) => ({ name: guide.title, path: guide.path })))
            : articleLd({ title: page.title, description: page.description, path: page.path, updated: page.updated }),
        ]}
      />

      <header className="space-y-3 border-b border-border pb-5">
        {!isHub && (
          <nav aria-label="Breadcrumb">
            <ol className="ui-label flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <li className="shrink-0">
                <Link href={LEARN_HUB.path} className="hover:text-foreground">
                  Learn
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0">
                /
              </li>
              <li aria-current="page" className="truncate">
                {page.title}
              </li>
            </ol>
          </nav>
        )}
        <h1 className="text-4xl leading-none font-medium break-words sm:text-5xl">{page.title}</h1>
        <p className="max-w-2xl text-[0.9375rem] text-muted-foreground">{lead ?? page.description}</p>
        <p className="text-xs text-muted-foreground">
          By{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
            {OPERATOR.name}
          </Link>{" "}
          · Updated <time dateTime={page.updated}>{formatLearnDate(page.updated)}</time>
        </p>
      </header>

      {children}

      {next && (
        <section className="panel flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-heading text-xl leading-tight font-medium">{next.title}</h2>
            {next.text && <p className="text-sm text-muted-foreground">{next.text}</p>}
          </div>
          <Button className="shrink-0" nativeButton={false} render={<Link href={next.href} />}>
            {next.label} <ArrowRightIcon aria-hidden />
          </Button>
        </section>
      )}

      {others.length > 0 && (
        <nav aria-label="More guides" className="space-y-1 pt-2">
          <p className="ui-label text-muted-foreground">More guides</p>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {others.map((guide) => (
              <li key={guide.path}>
                <Link
                  href={guide.path}
                  className="flex min-h-10 items-center justify-between gap-3 border-b border-border/60 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {guide.title}
                  <ArrowRightIcon className="size-3.5 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
