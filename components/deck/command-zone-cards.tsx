import { CardImage } from "@/components/card/card-image";
import { commandZone } from "@/lib/decks/command-zone";
import type { Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

/** The deck's commander, or both commanders of a pair side by side, for the deck page headers. */
export function CommandZoneCards({ deck }: { deck: Pick<Deck, "commander" | "partner"> }) {
  return (
    <div className={cn("shrink-0 self-center md:self-start", deck.partner ? "grid w-80 grid-cols-2 gap-2 md:w-96" : "w-48 md:w-52")}>
      {/* The commander is the foil of the deck: a sheen crosses it when the pointer comes onto it. */}
      {commandZone(deck).map((card) => (
        <div key={card.id} className="foil">
          <CardImage card={card} flippable eager />
        </div>
      ))}
    </div>
  );
}
