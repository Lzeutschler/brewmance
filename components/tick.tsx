import { cn } from "@/lib/utils";

/**
 * A counter that ticks: when `value` changes, the new figure rises into place. Quick enough to stay
 * out of the way of something that changes with every swipe.
 */
export function Tick({ value, className }: { value: string | number; className?: string }) {
  return (
    <span className={cn("inline-block", className)}>
      <span key={value} className="inline-block animate-[brew-tick_180ms_ease-out]">
        {value}
      </span>
    </span>
  );
}
