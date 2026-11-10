import { pickFlavor, type FlavorLine } from "@/lib/flavor";
import { cn } from "@/lib/utils";

/**
 * One line set like the flavor text at the bottom of a card: italic serif under a hairline. For the
 * rare moments where something is finished or still empty, never next to something to decide.
 */
export function FlavorText({ lines, seed, className }: { lines: readonly FlavorLine[]; seed: string; className?: string }) {
  const line = pickFlavor(lines, seed);
  return (
    <figure className={cn("w-full border-t border-border/70 pt-3 text-center font-flavor text-muted-foreground italic", className)}>
      <blockquote className="text-[0.9375rem] leading-snug">{line.by ? `“${line.text}”` : line.text}</blockquote>
      {line.by && <figcaption className="mt-1 text-sm text-muted-foreground/80">—{line.by}</figcaption>}
    </figure>
  );
}
