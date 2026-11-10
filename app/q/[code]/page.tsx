import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CardImage } from "@/components/card/card-image";
import { BrewLoader } from "@/components/cauldron";
import { EdhrecLink } from "@/components/edhrec-link";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { frontFaceName } from "@/lib/cards/names";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import { loadSharedQuiz, type ResolvedSharedQuiz } from "@/lib/server/shared-quiz";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/q/[code]">): Promise<Metadata> {
  const quiz = await loadSharedQuiz((await params).code);
  if (!quiz) return { title: "Commander matches", robots: { index: false } };

  const [top, ...others] = quiz.matches;
  const title = `${frontFaceName(top.card.name)} is my Commander match (${top.percent}%)`;
  const description =
    (others.length ? `Also on the shortlist: ${others.slice(0, 3).map((m) => frontFaceName(m.card.name)).join(", ")}. ` : "") +
    `Take the ${SITE.name} quiz and find the commander that fits you.`;
  return {
    title,
    description,
    // Every result is its own URL; search engines should index the quiz, not each shared result.
    robots: { index: false },
    openGraph: { type: "website", siteName: SITE.name, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function SharedQuizPage({ params }: PageProps<"/q/[code]">) {
  return (
    <Suspense fallback={<BrewLoader className="flex-1 justify-center">Reading the matches…</BrewLoader>}>
      {params.then(({ code }) => (
        <SharedQuiz code={code} />
      ))}
    </Suspense>
  );
}

async function SharedQuiz({ code }: { code: string }) {
  const quiz = await loadSharedQuiz(code);
  if (!quiz) notFound();
  return <SharedQuizView quiz={quiz} />;
}

const buildHref = (name: string) => `/build?commander=${encodeURIComponent(name)}`;

/** Someone's quiz result: the best match up front, the rest of their shortlist below, and the way to their own. */
function SharedQuizView({ quiz }: { quiz: ResolvedSharedQuiz }) {
  const [top, ...others] = quiz.matches;
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <section className="panel grid gap-6 p-4 sm:p-6 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-48 sm:w-56 md:w-full">
          <CardImage card={top.card} flippable eager />
        </div>
        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <p className="ui-label text-muted-foreground">
              Commander match for {quiz.track === "beginner" ? "a newcomer" : "an experienced player"}
            </p>
            <h1 className="text-3xl leading-tight font-medium md:text-4xl">{top.card.name}</h1>
            <p className="numeral text-2xl text-brand">{top.percent}% match</p>
          </div>
          {top.reasons.length > 0 && <Reasons reasons={top.reasons} />}
          <EdhrecLink href={edhrecCommanderUrl([top.card])} className="self-start text-sm text-muted-foreground">
            {frontFaceName(top.card.name)} on EDHREC
          </EdhrecLink>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/quiz" />}>
              Find your own commander <ArrowRightIcon />
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={buildHref(top.card.name)} />}>
              Build {frontFaceName(top.card.name)}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Swipe through play styles or just vibes, then meet the commanders that fit.
          </p>
        </div>
      </section>

      {others.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-medium">Also on the shortlist</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {others.map(({ card, percent, reasons }) => (
              <div key={card.id} className="space-y-2">
                <Link href={buildHref(card.name)} aria-label={`Build ${card.name}`} className="block rounded-[5%] transition hover:-translate-y-1">
                  <CardImage card={card} size="normal" />
                </Link>
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold text-brand tabular-nums">{percent}% match</span>
                  <EdhrecLink href={edhrecCommanderUrl([card])} className="text-xs text-muted-foreground">
                    EDHREC
                  </EdhrecLink>
                </p>
                {reasons.length > 0 && <Reasons reasons={reasons} small />}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Reasons({ reasons, small }: { reasons: string[]; small?: boolean }) {
  return (
    <ul className={cn("space-y-1.5 text-sm", small && "space-y-1 text-xs text-muted-foreground")}>
      {reasons.map((reason) => (
        <li key={reason} className="flex gap-2">
          <CheckIcon className={cn("mt-0.5 size-4 shrink-0 text-teal", small && "mt-px size-3.5")} aria-hidden />
          {reason}
        </li>
      ))}
    </ul>
  );
}
