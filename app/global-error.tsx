"use client";

import { SITE } from "@/lib/site";

import { fontVariables } from "./fonts";
import "./globals.css";

/** Replaces the root layout when it fails, so it brings its own document and only relies on global CSS. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className={`dark ${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center gap-5 px-4 text-center font-sans">
        <title>{`Something went wrong · ${SITE.name}`}</title>
        <h1 className="text-4xl leading-tight font-medium">{SITE.name} hit a snag</h1>
        <p className="max-w-md text-muted-foreground">
          The app could not load. Your decks are stored in your browser and are safe. Please try again in a moment.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/30%),0_2px_0_0_var(--primary-edge)] hover:bg-[var(--primary-hover)]"
          >
            Try again
          </button>
          {/* A full page load, since the client router is part of what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="inline-flex h-10 items-center rounded-md border border-input bg-card px-4 text-sm font-medium shadow-sm hover:bg-accent">
            Back to the start
          </a>
        </div>
      </body>
    </html>
  );
}
