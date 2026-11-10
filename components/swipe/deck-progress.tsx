"use client";

import { useState } from "react";

import { CheckIcon } from "@/components/icons";
import { Tick } from "@/components/tick";
import { CURVE_LABELS } from "@/lib/cards/mana";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { TEMPLATE_ROLES, TEMPLATE_ROLE_LABELS, type DeckTemplate, type TemplateRole } from "@/lib/deckbuilder/template";
import type { DeckStats } from "@/lib/decks/stats";
import type { Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

/**
 * Whether a role reached its target while the meters were on screen. Roles already covered when they
 * first showed do not count, so resuming a deck does not set off every check at once.
 */
function useFreshlyCovered(stats: DeckStats, template: DeckTemplate): (role: TemplateRole) => boolean {
  const [coveredAtFirst] = useState(() => new Set(TEMPLATE_ROLES.filter((role) => stats.roles[role] >= template.roles[role])));
  return (role) => !coveredAtFirst.has(role) && stats.roles[role] >= template.roles[role];
}

/** A share from 0 to 1 as a horizontal scale, so bars grow without animating their width. */
function fill(have: number, target: number): React.CSSProperties {
  return { transform: `scaleX(${target > 0 ? Math.min(1, have / target) : 1})` };
}

/**
 * Role counts against their targets. `quiet` keeps roles that are covered neutral, so only the ones
 * still short carry the accent (the deck editor); the swipe shows covered roles in green.
 */
export function RoleMeters({ stats, template, quiet = false }: { stats: DeckStats; template: DeckTemplate; quiet?: boolean }) {
  const fresh = useFreshlyCovered(stats, template);
  return (
    <div className="space-y-2.5">
      {TEMPLATE_ROLES.map((role) => {
        const have = stats.roles[role];
        const target = template.roles[role];
        return (
          <div key={role} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{TEMPLATE_ROLE_LABELS[role]}</span>
              <span className={cn("flex items-center gap-1 tabular-nums", have >= target && (quiet ? "text-muted-foreground" : "text-pick"))}>
                {have >= target && !quiet && (
                  <CheckIcon className={cn("size-3", fresh(role) && "animate-[brew-check_320ms_ease-out]")} aria-hidden />
                )}
                {have}/{target}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)]">
              <div
                className={cn(
                  "h-full origin-left transition-transform duration-500",
                  have < target ? "bg-brand" : quiet ? "bg-foreground/30" : "bg-pick",
                )}
                style={fill(have, target)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Two rows of small role meters for phones, where the full deck panel sits below the card. */
export function CompactRoleMeters({ stats, template }: { stats: DeckStats; template: DeckTemplate }) {
  const fresh = useFreshlyCovered(stats, template);
  return (
    <div className="grid w-full grid-cols-3 gap-x-3 gap-y-1.5">
      {TEMPLATE_ROLES.map((role) => {
        const have = stats.roles[role];
        const target = template.roles[role];
        return (
          <div key={role} className="min-w-0 space-y-0.5">
            <div className="flex justify-between gap-1 text-[11px] leading-tight">
              <span className="truncate text-muted-foreground">{TEMPLATE_ROLE_LABELS[role]}</span>
              <span className={cn("inline-block tabular-nums", have >= target && "text-pick", fresh(role) && "animate-[brew-pop_260ms_ease-out]")}>
                {have}/{target}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-xs bg-ink">
              <div
                className={cn("h-full origin-left transition-transform duration-500", have >= target ? "bg-pick" : "bg-brand")}
                style={fill(have, target)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniCurve({ stats, template }: { stats: DeckStats; template: DeckTemplate }) {
  const max = Math.max(...template.curve, ...stats.curve, 1);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {stats.curve.map((count, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="relative flex h-16 w-full items-end">
            <div
              className="absolute inset-x-0 border-t border-dashed border-foreground/40"
              style={{ bottom: `${(template.curve[i] / max) * 100}%` }}
              title={`Target: ${template.curve[i]}`}
            />
            <div
              className={cn(
                "h-full w-full origin-bottom rounded-t-xs transition-transform duration-500",
                count > template.curve[i] ? "bg-pass/85" : "bg-brand/85",
              )}
              style={{ transform: `scaleY(${count / max})` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{CURVE_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function DeckCounter({ deck, stats, template }: { deck: Deck; stats: DeckStats; template: DeckTemplate }) {
  const rules = BRACKET_INFO[deck.bracket];
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="numeral text-5xl" data-testid="picked-count">
            <Tick value={stats.total} />
            <span className="text-xl text-muted-foreground">/{template.size}</span>
          </div>
          <div className="ui-label mt-1 text-muted-foreground">cards picked</div>
        </div>
        <div className="text-right text-xs leading-relaxed text-muted-foreground tabular-nums">
          <div>
            Spells {stats.nonlands}/{template.size - template.lands}
          </div>
          <div title="Basic lands fill the remaining slots when you finish">
            Lands {stats.lands}/{template.lands}
          </div>
          <div>
            Game Changers {stats.gameChangers}/{Number.isFinite(rules.maxGameChangers) ? rules.maxGameChangers : "∞"}
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)]">
        <div className="h-full origin-left bg-brand transition-transform duration-500" style={fill(stats.total, template.size)} />
      </div>
    </div>
  );
}
