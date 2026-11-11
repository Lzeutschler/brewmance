"use client";

import { Slider } from "@base-ui/react/slider";
import { useId, useState } from "react";

import { MinusIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { karstenLands } from "@/lib/deckbuilder/template";
import { DECK_SIZE } from "@/lib/decks/types";

const MANA_VALUE = { min: 2, max: 5, step: 0.1, initial: 3 };
const CHEAP_SPELLS = { min: 0, max: 20, initial: 10 };

/** Rough mixes for people who have not counted their curve yet; each sets the slider. */
const PRESETS = [
  { id: "cheap", label: "Mostly cheap", value: 2.5 },
  { id: "mixed", label: "Mixed", value: 3 },
  { id: "expensive", label: "Mostly expensive", value: 3.6 },
] as const;

/** Slider steps are tenths; keep them exact so presets and the display match. */
function tenths(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Frank Karsten's land formula as two inputs and one number: the average mana value of the nonland cards
 * (slider with presets) and the cheap ramp and card draw spells (stepper).
 */
export function LandCalculator() {
  const [manaValue, setManaValue] = useState(MANA_VALUE.initial);
  const [cheap, setCheap] = useState(CHEAP_SPELLS.initial);
  const cheapLabelId = useId();

  const lands = Math.round(karstenLands(manaValue, cheap));
  const preset = PRESETS.find((p) => p.value === manaValue)?.id;

  return (
    <section aria-label="Land calculator" className="panel grid gap-6 p-4 sm:grid-cols-[1fr_11rem] sm:p-6">
      <div className="min-w-0 space-y-5">
        <Slider.Root
          value={manaValue}
          min={MANA_VALUE.min}
          max={MANA_VALUE.max}
          step={MANA_VALUE.step}
          largeStep={0.5}
          thumbAlignment="edge"
          onValueChange={(value) => setManaValue(tenths(Array.isArray(value) ? value[0] : value))}
          className="space-y-2"
        >
          <div className="flex items-baseline justify-between gap-3">
            <Slider.Label className="text-sm font-semibold text-foreground">
              Average mana value of your nonland cards
            </Slider.Label>
            <span className="numeral w-[3ch] shrink-0 text-right text-2xl" aria-hidden>
              {manaValue.toFixed(1)}
            </span>
          </div>
          <Slider.Control className="flex touch-none items-center py-3 select-none">
            <Slider.Track className="h-1.5 w-full rounded-xs bg-ink shadow-[inset_0_1px_0_0_oklch(0_0_0/40%)] select-none">
              <Slider.Indicator className="rounded-xs bg-brand select-none" />
              <Slider.Thumb
                getAriaValueText={(_, value) => `${value.toFixed(1)} average mana value`}
                className="size-5 rounded-full bg-primary shadow-sm ring-1 ring-ink select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
              />
            </Slider.Track>
          </Slider.Control>
          <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums" aria-hidden>
            <span>{MANA_VALUE.min.toFixed(1)}</span>
            <span>{MANA_VALUE.max.toFixed(1)}</span>
          </div>
        </Slider.Root>

        <ToggleGroup
          aria-label="Quick pick for the average mana value"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          value={preset ? [preset] : []}
          onValueChange={(values) => {
            const picked = PRESETS.find((p) => p.id === values[0]);
            if (picked) setManaValue(picked.value);
          }}
        >
          {PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id}>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="panel-inset flex items-center gap-3 p-2.5 pl-3">
          <p id={cheapLabelId} className="min-w-0 flex-1 text-sm font-semibold text-foreground">
            Ramp and card draw spells that cost 2 or less
          </p>
          <div className="flex shrink-0 items-center gap-1" role="group" aria-labelledby={cheapLabelId}>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Fewer cheap ramp and card draw spells"
              disabled={cheap <= CHEAP_SPELLS.min}
              onClick={() => setCheap((n) => Math.max(CHEAP_SPELLS.min, n - 1))}
            >
              <MinusIcon />
            </Button>
            <output className="numeral w-9 text-center text-2xl">{cheap}</output>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="More cheap ramp and card draw spells"
              disabled={cheap >= CHEAP_SPELLS.max}
              onClick={() => setCheap((n) => Math.min(CHEAP_SPELLS.max, n + 1))}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2 border-t border-border pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <output aria-live="polite" className="flex items-baseline gap-2">
          <span className="numeral w-[2ch] text-6xl text-brand">{lands}</span>
          <span className="text-sm text-muted-foreground">lands</span>
        </output>
        <p className="text-sm text-muted-foreground">
          In the {DECK_SIZE} cards besides your commander, by Frank Karsten&apos;s formula. That leaves{" "}
          <span className="text-foreground tabular-nums">{DECK_SIZE - lands}</span> for spells.
        </p>
      </div>
    </section>
  );
}
