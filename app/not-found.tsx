import type { Metadata } from "next";
import Link from "next/link";

import { SpilledCauldron } from "@/components/cauldron";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <div className="relative mb-2 flex flex-col items-center gap-3">
        <SpilledCauldron className="text-[5px] sm:text-[6px]" />
        <span className="numeral rounded-sm bg-brand px-2 py-1 text-3xl text-ink shadow-md">404</span>
      </div>
      <h1 className="text-4xl leading-tight font-medium">This card isn&apos;t in the library</h1>
      <p className="text-muted-foreground">
        The page you were looking for doesn&apos;t exist or has been exiled. Decks live in the browser they were built
        in; to open one on another device, use Share on the deck page and send that link.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to the start <ArrowRightIcon aria-hidden />
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/decks" />}>
          My decks
        </Button>
      </div>
    </div>
  );
}
