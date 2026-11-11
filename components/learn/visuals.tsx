import { CheckIcon } from "@/components/icons";
import { CURVE_LABELS } from "@/lib/cards/mana";
import { TEMPLATE_ROLES, TEMPLATE_ROLE_LABELS, type TemplateRole } from "@/lib/deckbuilder/template";
import { cn } from "@/lib/utils";

/**
 * Server-rendered copies of the role meters and the mana curve from the swipe screen
 * (components/swipe/deck-progress.tsx), for static pages: same markup, no hooks and no animation.
 */

/** A share from 0 to 1 as a horizontal scale, as in the swipe screen. */
function fill(have: number, target: number): React.CSSProperties {
  return { transform: `scaleX(${target > 0 ? Math.min(1, have / target) : 1})` };
}

/**
 * One count against a target. A reached target turns green with a check; `quiet` keeps it neutral instead,
 * for pages that only describe a deck.
 */
export function RoleBar({
  label,
  have,
  target,
  quiet = false,
  className,
}: {
  label: React.ReactNode;
  have: number;
  target: number;
  quiet?: boolean;
  className?: string;
}) {
  const reached = have >= target;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("flex items-center gap-1 tabular-nums", reached && (quiet ? "text-muted-foreground" : "text-pick"))}>
          {reached && !quiet && <CheckIcon className="size-3" aria-hidden />}
          {have}/{target}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)]">
        <div
          className={cn("h-full origin-left", !reached ? "bg-brand" : quiet ? "bg-foreground/30" : "bg-pick")}
          style={fill(have, target)}
        />
      </div>
    </div>
  );
}

/** The six deck roles (ramp, card draw, interaction, board wipes, protection, finishers) against their targets. */
export function RoleBars({
  roles,
  targets,
  quiet = false,
  className,
}: {
  roles: Record<TemplateRole, number>;
  targets: Record<TemplateRole, number>;
  quiet?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {TEMPLATE_ROLES.map((role) => (
        <RoleBar key={role} label={TEMPLATE_ROLE_LABELS[role]} have={roles[role]} target={targets[role]} quiet={quiet} />
      ))}
    </div>
  );
}

/**
 * Cards per mana value as six columns (≤1 to 6+), optionally with a dashed line at a target per column.
 * `counts` prints the number under each label. Screen readers get the numbers as one label.
 */
export function Curve({
  curve,
  target,
  counts = false,
  className,
}: {
  curve: readonly number[];
  target?: readonly number[];
  counts?: boolean;
  className?: string;
}) {
  const max = Math.max(...(target ?? []), ...curve, 1);
  const summary = curve.map((count, i) => `${CURVE_LABELS[i]}: ${count}`).join(", ");
  return (
    <div role="img" aria-label={`Cards by mana value. ${summary}`} className={cn("flex items-end gap-1.5", className)}>
      {curve.map((count, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="relative flex h-16 w-full items-end">
            {target && (
              <div
                className="absolute inset-x-0 border-t border-dashed border-foreground/40"
                style={{ bottom: `${(target[i] / max) * 100}%` }}
              />
            )}
            <div
              className="h-full w-full origin-bottom rounded-t-xs bg-brand/85"
              style={{ transform: `scaleY(${count / max})` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{CURVE_LABELS[i]}</span>
          {counts && <span className="numeral text-sm">{count}</span>}
        </div>
      ))}
    </div>
  );
}
