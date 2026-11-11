import Link from "next/link";

import { glossaryHref, type GlossaryTermId } from "@/lib/learn";
import { cn } from "@/lib/utils";

/**
 * Long-form text for the guides: the look of `Prose` (components/legal/prose.tsx) plus numbered lists, sub-headings
 * and tables. Tables follow the one in the deck stats panel; mark number cells with `data-num` to right-align them.
 * Wrap a wide table in `<div className="overflow-x-auto">` so it scrolls inside the panel on a phone.
 */
export function LearnProse({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "panel space-y-4 p-5 text-[0.9375rem] leading-relaxed text-muted-foreground sm:p-8",
        "[&_h2]:scroll-mt-20 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:font-medium [&_h2]:text-foreground [&_h2:first-child]:pt-0",
        "[&_h3]:scroll-mt-20 [&_h3]:pt-2 [&_h3]:text-lg [&_h3]:leading-tight [&_h3]:font-medium [&_h3]:text-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol>li]:pl-1",
        "[&_table]:w-full [&_table]:text-sm [&_caption]:pb-2 [&_caption]:text-left [&_caption]:text-xs",
        "[&_thead_th]:ui-label [&_th]:py-1.5 [&_th]:pr-3 [&_th:not([data-num])]:text-left [&_th]:font-medium [&_th]:text-foreground [&_th:last-child]:pr-0",
        "[&_td]:py-1.5 [&_td]:pr-3 [&_td]:align-top [&_td:last-child]:pr-0 [&_tbody_th]:align-top",
        "[&_tr]:border-b [&_tr]:border-border/60 [&_tbody_tr:last-child]:border-0",
        "[&_[data-num]]:text-right [&_[data-num]]:tabular-nums",
        "[&_a:not([data-slot])]:text-foreground [&_a:not([data-slot])]:underline [&_a:not([data-slot])]:underline-offset-2 [&_a:not([data-slot])]:decoration-brand/60 [&_a:not([data-slot]):hover]:text-brand",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A Magic word linked to its glossary entry. Quieter than a normal link, so a paragraph with several terms stays
 * calm: a dotted underline in the text's own color. `data-slot` keeps the prose link style off it.
 */
export function Term({ id, children, className }: { id: GlossaryTermId; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={glossaryHref(id)}
      data-slot="term"
      className={cn(
        "underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 transition-colors hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
