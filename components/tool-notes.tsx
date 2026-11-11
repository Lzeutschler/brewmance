import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Holds a tool page's own screen and makes it at least one screen tall (the viewport minus the 3.5rem header), so
 * the notes below always start under the fold. Its children keep `flex-1` working as they did directly in `<main>`.
 */
export function ToolScreen({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">{children}</div>;
}

/**
 * A short note below a tool: what it does, who it is for and where its data comes from. It sits after the tool,
 * never inside it, and stays quiet: muted body text, links underlined the way `Prose` does them; glossary terms keep
 * their dotted underline. Centered under centered tools; `wide` lines it up with a left-aligned `max-w-6xl` page.
 */
export function ToolNotes({ title, wide = false, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={cn("mx-auto w-full px-4 pt-12 pb-14 sm:pt-16", wide ? "max-w-6xl" : "max-w-3xl")}>
      <div
        className={cn(
          "space-y-3 border-t border-border pt-8 text-[0.9375rem] leading-relaxed text-muted-foreground [&_a:not([data-slot=term])]:text-foreground [&_a:not([data-slot=term])]:underline [&_a:not([data-slot=term])]:decoration-brand/60 [&_a:not([data-slot=term])]:underline-offset-2 [&_a:not([data-slot=term]):hover]:text-brand",
          wide && "max-w-3xl",
        )}
      >
        <h2 className="font-heading text-2xl leading-tight font-medium text-foreground">{title}</h2>
        {children}
      </div>
    </section>
  );
}
