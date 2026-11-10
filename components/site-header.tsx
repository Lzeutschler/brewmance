import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

import { FeedbackDialog } from "./feedback-dialog";
import { BrandMark, ChatCircleTextIcon } from "./icons";
import { ActiveNav, Nav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ink shadow-[0_1px_0_0_oklch(0_0_0/50%)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-8">
        <Link
          href="/"
          aria-label={SITE.name}
          className="-ml-1 flex shrink-0 items-center gap-2 rounded-md px-1 py-1 font-heading text-lg leading-none font-semibold whitespace-nowrap sm:text-xl"
        >
          <BrandMark className="size-7" />
          {/* Phones only have room for the logo next to the five nav links. */}
          <span className="max-sm:hidden">{SITE.name}</span>
        </Link>
        {/* The active link depends on the URL, which is only known at request time. */}
        <Suspense fallback={<Nav pathname={null} />}>
          <ActiveNav />
        </Suspense>
        {/* Phones find it in the footer; the header has no room next to the five nav links. */}
        <FeedbackDialog>
          <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground max-sm:hidden">
            <ChatCircleTextIcon /> Feedback
          </Button>
        </FeedbackDialog>
      </div>
    </header>
  );
}
