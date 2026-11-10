"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Cauldron } from "@/components/cauldron";
import { ArrowCounterClockwiseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center"
    >
      <Cauldron mood="boiling" className="text-[5px]" />
      <h1 className="text-4xl leading-tight font-medium">This brew fizzled</h1>
      <p className="text-muted-foreground">
        Something boiled over and interrupted this page. Your decks are stored in your browser and are safe. Try again, or
        head back to the start.
      </p>
      {digest && <p className="font-mono text-xs text-muted-foreground">Error ID: {digest}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>
          <ArrowCounterClockwiseIcon aria-hidden /> Try again
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to the start
        </Button>
      </div>
    </div>
  );
}
