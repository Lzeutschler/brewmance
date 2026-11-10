"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ManaSymbol } from "@/components/card/mana";
import { CheckCircleIcon, WarningIcon } from "@/components/icons";
import { RoleMeters } from "@/components/swipe/deck-progress";
import { CURVE_LABELS, isLand } from "@/lib/cards/mana";
import { useDeckCombos } from "@/lib/data/client";
import { BRACKET_INFO, deckBracketIssues } from "@/lib/deckbuilder/brackets";
import { comboBreaksBracket, combosInDeck } from "@/lib/deckbuilder/combos";
import { deckTemplate } from "@/lib/deckbuilder/settings";
import { karstenLands } from "@/lib/deckbuilder/template";
import { CARD_TYPES, deckStats, expandEntries } from "@/lib/decks/stats";
import { commandZone, deckIdentity } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

/** Below this many nonland cards, Karsten's land estimate says little about the finished deck. */
const MIN_NONLANDS_FOR_KARSTEN = 40;

export function DeckStatsPanel({ deck }: { deck: Deck }) {
  const stats = deckStats(deck);
  const template = deckTemplate(deck);
  const cards = expandEntries(deck.entries);
  const commanders = commandZone(deck).map((c) => c.name);
  const combosQuery = useDeckCombos(
    commanders,
    cards.filter((c) => !isLand(c) || !c.typeLine.startsWith("Basic")).map((c) => c.name),
  );
  const combos = combosInDeck(combosQuery.data?.combos ?? [], new Set([...commanders, ...cards.map((c) => c.name)]));
  const issues = deckBracketIssues(cards, deck.bracket, { commanders, combos });
  const missing = template.size - stats.total;
  const karsten = Math.round(karstenLands(stats.averageManaValue, stats.cheapRampDraw));
  const curveData = stats.curve.map((count, i) => ({ label: CURVE_LABELS[i], count }));
  const colors = deckIdentity(deck);
  const totalPips = colors.reduce((sum, c) => sum + stats.pips[c], 0);
  // A quarter of the lands plus the color's share of the pips, as when basics are added.
  const sourceTarget = (color: Deck["commander"]["colorIdentity"][number]) =>
    totalPips && stats.pips[color] ? Math.round(stats.lands * (0.25 + (0.75 * stats.pips[color]) / totalPips)) : 0;

  return (
    <div className="panel divide-y divide-border">
      <section className="space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="numeral text-5xl">
            {stats.total}
            <span className="text-xl text-muted-foreground">/{template.size}</span>
          </span>
          <span className="text-sm text-muted-foreground">+ {deck.partner ? "2 commanders" : "commander"}</span>
        </div>
        <StatusLine ok={missing === 0}>
          {missing === 0 ? "Deck size is legal" : missing > 0 ? `${missing} cards missing` : `${-missing} cards too many`}
        </StatusLine>
        <StatusLine ok={issues.length === 0}>
          {issues.length === 0 ? `Fits bracket ${deck.bracket} (${BRACKET_INFO[deck.bracket].name})` : issues.join(" · ")}
        </StatusLine>
        {stats.nonlands >= MIN_NONLANDS_FOR_KARSTEN && (
          <StatusLine ok={Math.abs(stats.lands - karsten) <= 1}>
            {Math.abs(stats.lands - karsten) <= 1
              ? `${stats.lands} lands suit this curve`
              : `Frank Karsten's formula suggests about ${karsten} lands for this curve and ${stats.cheapRampDraw} cheap ramp/draw spells`}
          </StatusLine>
        )}
      </section>

      {/* Key figures as plain numbers on a hairline grid. */}
      <dl className="grid grid-cols-3 [&>div]:border-border [&>div:nth-child(-n+3)]:border-b [&>div:nth-child(3n+2)]:border-x">
        <Metric label="avg. mana value" value={stats.averageManaValue.toFixed(2)} />
        <Metric label={`lands (target ${template.lands})`} value={String(stats.lands)} />
        <Metric label="est. price" value={`$${Math.round(stats.priceUsd)}`} />
        <Metric
          label={template.maxTutors === null ? "tutors" : `tutors (max. ${template.maxTutors})`}
          value={String(stats.tutors)}
        />
        <Metric label="interaction ≤2 mana" value={String(stats.cheapInteraction)} />
        <Metric label="ramp & draw ≤2 mana" value={String(stats.cheapRampDraw)} />
      </dl>

      <section className="space-y-2 p-4">
        <h3 className="ui-label text-muted-foreground">Mana curve</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={curveData} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "oklch(1 0 0 / 5%)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, boxShadow: "var(--shadow-lg)" }}
                formatter={(value) => [value, "cards"]}
              />
              <Bar dataKey="count" fill="var(--brand)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-3 p-4">
        <h3 className="ui-label text-muted-foreground">Roles</h3>
        <RoleMeters stats={stats} template={template} quiet />
      </section>

      <section className="space-y-2 p-4">
        <h3 className="ui-label text-muted-foreground">Combos</h3>
        {combosQuery.isError ? (
          <p className="text-xs text-muted-foreground">Commander Spellbook is unavailable right now.</p>
        ) : combosQuery.isPending ? (
          <p className="text-xs text-muted-foreground">Checking Commander Spellbook…</p>
        ) : combos.length === 0 ? (
          <p className="text-xs text-muted-foreground">No combos from Commander Spellbook in this deck.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {combos.map((combo) => (
              <li key={combo.id} className={cn(comboBreaksBracket(combo, deck.bracket) && "text-ember")}>
                <div className="font-semibold">{combo.cards.join(" + ")}</div>
                <div className="text-xs text-muted-foreground">{combo.results.join(" · ")}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {colors.length > 0 && (
        <section className="space-y-2 p-4">
          <h3 className="ui-label text-muted-foreground">Colors: pips vs. land sources</h3>
          <table className="w-full text-sm">
            <tbody>
              {colors.map((color) => (
                <tr key={color} className="border-b border-border/60 last:border-0">
                  <td className="py-1.5">
                    <ManaSymbol symbol={color} />
                  </td>
                  <td className="py-1.5 text-muted-foreground">
                    {totalPips ? Math.round((stats.pips[color] / totalPips) * 100) : 0}% of pips
                  </td>
                  <td
                    className={cn("py-1.5 text-right tabular-nums", stats.sources[color] < sourceTarget(color) && "text-ember")}
                    title={`Aim for about ${sourceTarget(color)} sources`}
                  >
                    {stats.sources[color]} sources
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="space-y-2 p-4">
        <h3 className="ui-label text-muted-foreground">Card types</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {CARD_TYPES.filter((type) => stats.types[type]).map((type) => (
            <div key={type} className="flex justify-between">
              <span className="text-muted-foreground">{type}</span>
              <span className="tabular-nums">{stats.types[type]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircleIcon : WarningIcon;
  return (
    <p className={cn("flex items-start gap-2 text-sm", ok ? "text-pick" : "text-ember")}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 px-4 py-3">
      <dt className="text-xs leading-tight text-muted-foreground">{label}</dt>
      <dd className="numeral text-2xl">{value}</dd>
    </div>
  );
}
