"use client";

import { useState } from "react";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardSheet } from "@/components/card/card-sheet";
import { ManaCost } from "@/components/card/mana";
import type { Card } from "@/lib/cards/types";
import type { PreconCommander, PreconTypeGroup } from "@/lib/precons/analysis";
import { cn } from "@/lib/utils";

interface Row {
  name: string;
  count: number;
  manaCost: string;
  gameChanger: boolean;
  image: Card["image"];
  typeLine: string;
}

/**
 * The card sheet takes a full card; a precon page only carries what the list shows, so the rest stays empty
 * (no roles, no price) and the type line falls back to the group's type.
 */
function sheetCard(row: Row): Card {
  return {
    id: row.name,
    oracleId: row.name,
    name: row.name,
    manaCost: row.manaCost,
    cmc: 0,
    typeLine: row.typeLine,
    oracleText: "",
    colorIdentity: [],
    producedMana: [],
    image: row.image,
    edhrecRank: null,
    gameChanger: row.gameChanger,
    roles: [],
    priceUsd: null,
  };
}

function groupTitle(type: string, count: number): string {
  if (type === "Commander") return count > 1 ? "Commanders" : "Commander";
  if (type === "Other") return "Other";
  return `${type}s`.replace("Sorcerys", "Sorceries");
}

/**
 * The printed list by card type, commanders first, as on a shared deck: hovering a name shows the card, tapping it
 * opens it big enough to read.
 */
export function PreconDecklist({ commanders, groups }: { commanders: PreconCommander[]; groups: PreconTypeGroup[] }) {
  const [inspected, setInspected] = useState<Card | null>(null);

  const sections = [
    {
      type: "Commander",
      count: commanders.length,
      rows: commanders.map((c) => ({ ...c, count: 1 })),
    },
    ...groups.map((group) => ({
      type: group.type,
      count: group.count,
      rows: group.cards.map((row) => ({ ...row, typeLine: group.type === "Other" ? "" : group.type })),
    })),
  ];

  return (
    <>
      <div className="columns-1 gap-5 md:columns-2">
        {sections.map((section) => (
          <section key={section.type} className="mb-5 break-inside-avoid">
            <h3 className="ui-label mb-2 flex items-baseline gap-2 text-muted-foreground">
              {groupTitle(section.type, section.count)}
              <span className="text-foreground tabular-nums">{section.count}</span>
            </h3>
            <ul className="panel divide-y divide-border/60 p-1">
              {section.rows.map((row) => (
                <CardHoverPreview key={row.name} card={row}>
                  <li className="flex min-h-10 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                    <span className="w-5 text-right text-muted-foreground tabular-nums">{row.count}</span>
                    <button
                      type="button"
                      onClick={() => setInspected(sheetCard(row))}
                      className={cn("min-h-9 flex-1 truncate text-left hover:underline", row.gameChanger && "text-brand")}
                      title={row.gameChanger ? "Game Changer" : undefined}
                    >
                      {row.name}
                    </button>
                    <ManaCost cost={row.manaCost} className="shrink-0" />
                  </li>
                </CardHoverPreview>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <CardSheet card={inspected} onClose={() => setInspected(null)} />
    </>
  );
}
