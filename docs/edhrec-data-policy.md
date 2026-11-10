# EDHREC: Datennutzung erlaubt (Antwort vom 23.10.2026)

Antwort von Tommy (EDHREC) auf die Anfrage an contact@edhrec.com. EDHREC und Space Cow Media laden
Community-Entwickler ausdrücklich ein, EDHREC-Daten in eigenen Projekten zu nutzen. Die Regeln, zusammengefasst:

| Regel | So hält Brewmance sie ein |
| --- | --- |
| HTTP-Anfragen wie die des Browsers sind erlaubt. | Die App liest dieselben `json.edhrec.com/pages/…`-Seiten wie edhrec.com. |
| Höchstens 1 Anfrage pro Sekunde, gerade bei Fehlern. Wer das verletzt, kann gesperrt werden. | Zur Laufzeit stellt `upstreamFetch` (`lib/server/upstream.ts`) EDHREC-Anfragen mit mindestens 1 s Abstand in eine Warteschlange. Wer länger als 4 s warten müsste, bekommt sofort „busy“, und die App nutzt ihre eigene Bewertung. Im Daten-Build (`scripts/build-card-db.ts`) laufen die rund 95 Seiten ebenfalls im Abstand von 1 s. |
| Nach 429 mindestens 2 s warten. | Laufzeit: 5 Minuten Pause (oder `Retry-After`), auch nach 403 und 5xx. Build: Nach 429/403 gehen keine weiteren Anfragen raus, es gilt der Cache. |
| User-Agent mit Projektname und Kontakt-Mail. | `Brewmance/0.1 <info@45level.com> (+https://www.brewmance.app)` (`USER_AGENT` in `lib/site.ts`). |
| Keine Doku, Felder können sich jederzeit ändern. | Die Antworten werden mit zod geprüft. Bei unerwartetem Format greift die eigene Bewertung. |
| Wenn das Projekt läuft, gern zeigen: edhrec@edhrec.com. | Offen: nach dem Launch eine Mail schicken. |
| Patreon-Abo, falls möglich. | Freiwillig. |
| Die Policy wird gerade überarbeitet und kann sich ändern. | `RECS_SOURCE=off` schaltet EDHREC sofort ab (siehe `docs/development.md`). |

**Grenze:** Der Abstand gilt pro Server-Instanz. Startet Vercel bei viel Verkehr mehrere Instanzen, können
zusammen kurz mehr als 1 Anfrage pro Sekunde rausgehen. Dagegen helfen der CDN-Cache von `/api/candidates`
(einen Tag) und `"use cache"`. Hart garantieren ließe sich das Limit nur mit einem geteilten Zähler oder
`"use cache: remote"`.

**Bulk-Daten (genutzt als Ersatz):** `https://edhrec.com/data/data.tgz` (275 MB komprimiert, Stand 23.10.2026) enthält `edhrec.csv`
(672 MB) und eine `LICENSE.txt`. Die Lizenz erlaubt die Nutzung in Community-Projekten, aber **keine kommerzielle
Nutzung**. Brewmance ist nicht kommerziell. Mit Werbung oder Bezahlfunktionen wäre das neu zu prüfen.

Ausgewertet am 23.10.2026:
- Spalten `commander,card,count`, 15,4 Mio. Zeilen, 3.626 Commander, 32.441 verschiedene Karten.
- Eine Deckzahl pro Commander fehlt. Die höchste Kartenzahl eines Commanders (meist ein Standardland oder Command
  Tower) taugt als Ersatz: Bei Krenko 43.757 gegenüber 44.809 live, also rund 2 % zu wenig. Die Kartenzahlen selbst
  stimmen fast genau mit der Live-Seite überein (Sol Ring 38.194 gegenüber 38.223).
- Partner-Decks stehen nur unter einem der beiden Commander, gemischt mit dessen Solo-Decks. Tymna hat 593 Decks
  statt 172 solo, Kraum fehlt ganz. Backgrounds fehlen als eigene Commander (Decks stehen unter der Kreatur).
- Keine Brackets, keine Themes, keine Synergy. Synergy ließe sich gegen den Durchschnitt derselben Farbidentität
  selbst berechnen.
- 265 Commander haben weniger als 20 Decks, das ist zu wenig für brauchbare Anteile.
- Eingedampft auf die Top 200 Karten pro Commander (ohne Standardländer) sind es 17,7 MB, gzip 8,9 MB, also
  rund 5 KB pro Commander (2,5 KB gzip). Top 100: 8,9 MB, Top 300: 26 MB.
- Von den 220 Karten der Krenko-Live-Seite stecken 179 in den CSV-Top-200. Die fehlenden sind seltene Karten mit
  hoher Synergy, die eine Auswahl nach Synergy zusätzlich hereinholen würde.

Umgesetzt (23.10.2026): `scripts/build-recs-snapshot.ts` lädt das Archiv beim Build (eine Anfrage, eine Woche
gecacht) und dampft es auf eine Datei pro Commander in `data/recs-snapshot/` ein: die 200 meistgespielten Karten
und bis zu 60 weitere mit hoher Synergy. Fallen EDHRECs Seiten aus, liest `lib/recs/provider.ts` diese Dateien,
statt nur nach allgemeiner Beliebtheit zu raten. Die selbst berechnete Synergy liegt bei Krenko im Median 0,017
neben EDHRECs Wert. Schreibweisen derselben Karte (Großbuchstaben, Anführungszeichen) werden zusammengeführt.
`RECS_SOURCE=off` lädt nichts und löscht den Snapshot.
