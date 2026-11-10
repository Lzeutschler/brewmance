"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CircleNotchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { asPairable, canPair } from "@/lib/cards/pairing";
import type { Card } from "@/lib/cards/types";
import { resolveCardNames } from "@/lib/data/client";
import { parseDeckList } from "@/lib/deck-io/parse";
import type { DeckEntry } from "@/lib/decks/types";
import { useDeckStore } from "@/stores/decks";

const PLACEHOLDER = `Commander
1 Krenko, Mob Boss

Deck
1 Sol Ring
1 Goblin Warchief
30 Mountain`;

export function ImportDialog({
  children,
  destination = (id) => `/decks/${id}`,
}: {
  children: React.ReactElement;
  /** Where the imported deck opens; the editor unless the import started somewhere else. */
  destination?: (deckId: string) => string;
}) {
  const router = useRouter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importDeck = async () => {
    setError(null);
    const parsed = parseDeckList(text);
    if (!parsed.commanders.length) {
      setError('Add a "Commander" section or mark your commander with *CMDR*.');
      return;
    }
    if (parsed.commanders.length > 2) {
      setError("A deck has at most two commanders.");
      return;
    }
    setBusy(true);
    try {
      const names = [...parsed.commanders, ...parsed.cards, ...parsed.maybe].map((l) => l.name);
      const { cards, missing } = await resolveCardNames(names);
      const commander = cards[parsed.commanders[0].name];
      if (!commander) {
        setError(`Could not find the commander "${parsed.commanders[0].name}".`);
        return;
      }
      const partnerName = parsed.commanders[1]?.name;
      const partner = partnerName ? cards[partnerName] : undefined;
      if (partnerName && !partner) {
        setError(`Could not find the commander "${partnerName}".`);
        return;
      }
      if (partner && !canPair(asPairable(commander), asPairable(partner))) {
        setError(`${commander.name} and ${partner.name} cannot be commanders together.`);
        return;
      }

      const entries = new Map<string, DeckEntry>();
      for (const line of parsed.cards) {
        const card = cards[line.name];
        if (!card) continue;
        const existing = entries.get(card.id);
        entries.set(card.id, { card, quantity: (existing?.quantity ?? 0) + line.quantity });
      }
      const maybe = parsed.maybe.map((l) => cards[l.name]).filter((c): c is Card => Boolean(c));

      const id = createDeck({ commander, partner, bracket: 3, theme: null, entries: [...entries.values()], maybe });
      if (missing.length) toast.warning(`Skipped ${missing.length} unknown card(s): ${missing.slice(0, 5).join(", ")}`);
      else toast.success("Deck imported");
      setOpen(false);
      router.push(destination(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a deck</DialogTitle>
          <DialogDescription>Paste a list from Moxfield, Archidekt, MTG Arena or plain text.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="h-72 font-mono text-xs"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={importDeck} disabled={busy || !text.trim()}>
            {busy && <CircleNotchIcon className="animate-spin" />} Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
