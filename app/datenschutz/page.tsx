import type { Metadata } from "next";
import Link from "next/link";

import { Address, ExternalLink, PageHeader, Prose } from "@/components/legal/prose";
import { canonical } from "@/lib/metadata";
import { LEGAL_LAST_UPDATED, OPERATOR, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutz / Privacy",
  description: `Privacy policy of ${SITE.name}: no accounts, no cookies, no ads — what happens to your data.`,
  ...canonical("/datenschutz"),
};

const mail = <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>;

/** Supervisory authority for a controller based in North Rhine-Westphalia. */
const AUTHORITY = [
  "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen",
  "Kavalleriestraße 2-4",
  "40213 Düsseldorf",
];

// Keeps the app's original name: renaming the persisted key would drop every saved deck.
const STORAGE_KEY = "commander-tinder";

export default function DatenschutzPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <PageHeader title="Datenschutzerklärung" lang="de">
        <p lang="de">
          Deutsch ·{" "}
          <a href="#en" className="underline underline-offset-2 hover:text-foreground">
            English version
          </a>
        </p>
      </PageHeader>
      <PrivacyDe />
      <PrivacyEn />
    </article>
  );
}

function PrivacyDe() {
  return (
    <Prose id="de" lang="de" aria-label="Datenschutzerklärung (Deutsch)">
      <h2>Das Wichtigste in Kürze</h2>
      <p>
        {SITE.name} ist ein privates, kostenloses Hobbyprojekt ohne kommerzielle Interessen. Ich möchte so wenig
        Daten wie möglich verarbeiten:
      </p>
      <ul>
        <li>
          Keine Nutzerkonten, keine Cookies, keine Werbung. Für anonyme Besucherstatistiken nutze ich Vercel Web
          Analytics, das ohne Cookies auskommt.
        </li>
        <li>Ihre Decks und Swipe-Sitzungen bleiben im Speicher Ihres Browsers und werden nicht an mich übertragen.</li>
        <li>
          Beim Aufruf verarbeitet der Hoster Vercel technisch notwendige Verbindungsdaten. Kartenbilder und Mana-Symbole
          lädt Ihr Browser direkt von Scryfall (USA).
        </li>
      </ul>

      <h2>1. Verantwortlicher</h2>
      <Address
        lines={[OPERATOR.name, OPERATOR.street, `${OPERATOR.postalCode} ${OPERATOR.city}`, OPERATOR.country.de]}
      />
      <p>
        E-Mail: {mail}
        <br />
        Siehe auch das <Link href="/impressum">Impressum</Link>.
      </p>

      <h2>2. Hosting und Server-Logfiles (Vercel)</h2>
      <p>
        Die Website wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA gehostet. Bei jedem Aufruf
        verarbeitet Vercel automatisch Daten, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit, aufgerufene
        URL, Referrer, Browser, Betriebssystem und übertragene Datenmenge. Das ist technisch nötig, um die Seite
        auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist mein berechtigtes Interesse an einem sicheren
        und funktionierenden Angebot (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Dabei können Daten auch in den USA verarbeitet werden. Vercel ist unter dem EU-U.S. Data Privacy Framework
        zertifiziert, für das ein Angemessenheitsbeschluss der EU-Kommission besteht (Art. 45 DSGVO). Vercel hält die
        Logdaten nur für begrenzte Zeit vor; ich werte sie nicht systematisch aus. Mehr dazu in der{" "}
        <ExternalLink href="https://vercel.com/legal/privacy-policy">Datenschutzerklärung von Vercel</ExternalLink>.
      </p>

      <h2>3. Kartenbilder und Mana-Symbole (Scryfall)</h2>
      <p>
        Kartenbilder kommen von <code>cards.scryfall.io</code>, Mana-Symbole von <code>svgs.scryfall.io</code>. Ihr
        Browser lädt sie direkt bei Scryfall (USA); die Mana-Symbole werden dabei über das Netz von Cloudflare
        ausgeliefert. Scryfall erhält so Ihre IP-Adresse, die Browserkennung und als Referrer die Adresse dieser Website
        (ohne Pfad). Cookies werden dabei nach meiner Prüfung nicht gesetzt. Rechtsgrundlage ist mein berechtigtes
        Interesse, die Karten so anzuzeigen, wie Scryfall es für Fan-Projekte vorsieht (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Scryfall war bei meiner Prüfung im Oktober 2026 nicht unter dem EU-U.S. Data Privacy Framework gelistet. Für
        diese Übermittlung in die USA gibt es daher keinen Angemessenheitsbeschluss; US-Behörden könnten auf die Daten
        zugreifen. Mehr dazu in den{" "}
        <ExternalLink href="https://scryfall.com/docs/privacy">Datenschutzhinweisen von Scryfall</ExternalLink>.
      </p>

      <h2>4. Kartendaten und Empfehlungen (Scryfall, EDHREC)</h2>
      <p>
        Die Kartendatenbank wird beim Bauen der Website aus den öffentlichen Bulk-Daten von Scryfall erzeugt.
        Kartenvorschläge fragt der Server bei EDHREC (edhrec.com) ab, nur mit dem gewählten Commander, Bracket und Thema.
        Ihre IP-Adresse oder andere Daten über Sie gehen dabei nicht an Scryfall oder EDHREC.
      </p>

      <h2>5. Speicherung im Browser (localStorage)</h2>
      <p>
        Ihre Decks, laufende Swipe-Sitzungen und zugehörige Einstellungen werden im lokalen Speicher (localStorage) Ihres
        Browsers unter dem Schlüssel <code>{STORAGE_KEY}</code> abgelegt. Sie verlassen Ihr Gerät nicht und ich kann
        sie nicht einsehen, es sei denn, Sie exportieren oder kopieren eine Deckliste selbst.
      </p>
      <p>
        Diese Speicherung ist unbedingt erforderlich, damit Sie Decks bauen und wieder öffnen können; eine Einwilligung
        ist dafür nicht nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. f DSGVO). Löschen können Sie die Daten,
        indem Sie Decks in der App entfernen oder die Websitedaten in Ihrem Browser löschen.
      </p>

      <h2>6. Besucherstatistik (Vercel Web Analytics)</h2>
      <p>
        Um zu sehen, wie viele Menschen die Website nutzen und welche Seiten aufgerufen werden, setze ich Vercel Web
        Analytics ein. Das Skript wird von dieser Domain geladen und übermittelt bei jedem Seitenaufruf die aufgerufene
        Seite, den Referrer, Datum und Uhrzeit, Browser, Betriebssystem, Gerätetyp und das aus der IP-Adresse
        abgeleitete Land an Vercel. Es werden keine Cookies gesetzt und nichts in Ihrem Browser gespeichert. Besucher
        werden nur über einen Hashwert aus der Anfrage unterschieden, der nach 24 Stunden verworfen wird; die IP-Adresse
        wird dafür nicht gespeichert. Ich sehe nur zusammengefasste Zahlen, keine einzelnen Personen.
      </p>
      <p>
        Rechtsgrundlage ist mein berechtigtes Interesse, die Nutzung der Website in anonymisierter Form auszuwerten und
        sie zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Zu Vercel als Empfänger und zur Übermittlung in die USA siehe
        Abschnitt 2. Sie können dieser Verarbeitung widersprechen (Art. 21 DSGVO) oder sie mit einem Content-Blocker
        verhindern. Mehr dazu bei{" "}
        <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">Vercel</ExternalLink>.
      </p>

      <h2>7. Keine Cookies, lokale Schriftarten</h2>
      <p>
        Ich setze keine Cookies und keine Tracking- oder Werbedienste ein. Deshalb gibt es auch kein Cookie-Banner. Die
        Schriftarten (Inter, Cinzel) werden vom eigenen Server geladen, nicht von Google oder anderen Anbietern.
      </p>

      <h2>8. Kontakt per E-Mail</h2>
      <p>
        Wenn Sie mir schreiben, nutze ich Ihre Angaben nur, um Ihre Nachricht zu beantworten (Art. 6 Abs. 1 lit. f
        DSGVO), und lösche sie, wenn sich die Sache erledigt hat.
      </p>

      <h2>9. Links zu anderen Websites</h2>
      <p>
        Links etwa zu Scryfall, EDHREC, LinkedIn oder GitHub sind einfache Links. Daten werden erst übertragen, wenn Sie
        darauf klicken; danach gilt die Datenschutzerklärung des jeweiligen Anbieters.
      </p>

      <h2>10. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung
        der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Außerdem können Sie Verarbeitungen auf Grundlage
        von Art. 6 Abs. 1 lit. f DSGVO aus Gründen, die sich aus Ihrer besonderen Situation ergeben,{" "}
        <strong>widersprechen</strong> (Art. 21). Eine E-Mail an {mail} genügt.
      </p>
      <p>
        Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO). Zuständig ist:
      </p>
      <Address lines={AUTHORITY} />
      <p>
        Telefon: +49 211 38424-0 · E-Mail: <a href="mailto:poststelle@ldi.nrw.de">poststelle@ldi.nrw.de</a> · Website:{" "}
        <ExternalLink href="https://www.ldi.nrw.de" />
      </p>

      <h2>11. Änderungen</h2>
      <p>
        Die Verbindung zur Website ist per TLS verschlüsselt. Ich passe diese Erklärung an, wenn sich die Website ändert;
        es gilt die hier veröffentlichte Fassung.
      </p>
      <p className="pt-2 text-xs">Stand: {LEGAL_LAST_UPDATED.de}</p>
    </Prose>
  );
}

function PrivacyEn() {
  return (
    <Prose id="en" lang="en" aria-label="Privacy policy (English)">
      <h2>Privacy policy (English)</h2>
      <p>This is a courtesy translation. The German version above is legally binding.</p>

      <h3>Summary</h3>
      <p>
        {SITE.name} is a private, free hobby project with no commercial interest, and I want to process as little
        data as possible:
      </p>
      <ul>
        <li>No user accounts, no cookies, no ads. Anonymous visitor statistics come from Vercel Web Analytics, which uses no cookies.</li>
        <li>Your decks and swipe sessions stay in your browser’s storage and are never sent to me.</li>
        <li>
          The host Vercel processes technically necessary connection data. Your browser loads card images and mana
          symbols directly from Scryfall (USA).
        </li>
      </ul>

      <h3>1. Controller</h3>
      <p>
        {OPERATOR.name}, {OPERATOR.street}, {OPERATOR.postalCode} {OPERATOR.city}, {OPERATOR.country.en}. Email:{" "}
        {mail}. See also the <Link href="/impressum">legal notice</Link>.
      </p>

      <h3>2. Hosting and server logs (Vercel)</h3>
      <p>
        The site is hosted by Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA. For every request, Vercel
        processes the data your browser sends: IP address, date and time, requested URL, referrer, browser, operating
        system and amount of data. This is needed to deliver the site and protect it from attacks (legitimate interest,
        Art. 6(1)(f) GDPR). Data may be processed in the USA; Vercel is certified under the EU-U.S. Data Privacy
        Framework, which is covered by an adequacy decision (Art. 45 GDPR). Vercel keeps logs only for a limited time; I
        do not analyse them systematically. More:{" "}
        <ExternalLink href="https://vercel.com/legal/privacy-policy">Vercel privacy policy</ExternalLink>.
      </p>

      <h3>3. Card images and mana symbols (Scryfall)</h3>
      <p>
        Your browser loads card images from <code>cards.scryfall.io</code> and mana symbols from{" "}
        <code>svgs.scryfall.io</code> directly from Scryfall (USA); mana symbols are delivered through Cloudflare’s
        network. Scryfall receives your IP address, your browser’s user agent and, as referrer, this site’s address
        without the path. In my tests no cookies were set. The legal basis is my legitimate interest in showing cards the
        way Scryfall intends for fan projects (Art. 6(1)(f) GDPR). When I checked in October 2026, Scryfall was not
        listed under the EU-U.S. Data Privacy Framework, so no adequacy decision covers this transfer and US authorities
        could access the data. More:{" "}
        <ExternalLink href="https://scryfall.com/docs/privacy">Scryfall privacy information</ExternalLink>.
      </p>

      <h3>4. Card data and suggestions (Scryfall, EDHREC)</h3>
      <p>
        The card database is built from Scryfall’s public bulk data when the site is deployed. The server asks EDHREC for
        suggestions using only the selected commander, bracket and theme. No data about you is sent to Scryfall or
        EDHREC in the process.
      </p>

      <h3>5. Browser storage (localStorage)</h3>
      <p>
        Your decks, running swipe sessions and related settings are stored in your browser’s localStorage under the key{" "}
        <code>{STORAGE_KEY}</code>. They never leave your device unless you export or copy a deck list yourself, and I
        cannot see them. This storage is strictly necessary for the feature you use, so no consent is required (§ 25(2)
        no. 2 TDDDG, Art. 6(1)(f) GDPR). Delete decks in the app or clear the site data in your browser to remove them.
      </p>

      <h3>6. Visitor statistics (Vercel Web Analytics)</h3>
      <p>
        To see how many people use the site and which pages they visit, I use Vercel Web Analytics. The script is
        loaded from this domain and sends Vercel the page you open, the referrer, date and time, browser, operating
        system, device type and the country derived from your IP address. It sets no cookies and stores nothing in your
        browser. Visitors are told apart only by a hash of the request that is discarded after 24 hours; your IP address
        is not stored for this. I only see aggregated numbers, never individual people. The legal basis is my legitimate
        interest in evaluating use of the site in anonymised form to improve it (Art. 6(1)(f) GDPR); see section 2 for
        Vercel and transfers to the USA. You can object (Art. 21 GDPR) or block it with a content blocker. More:{" "}
        <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">Vercel</ExternalLink>.
      </p>

      <h3>7. No cookies, local fonts</h3>
      <p>
        I set no cookies and use no tracking or advertising services, which is why there is no cookie banner. Fonts
        (Inter, Cinzel) are served from this site, not from Google or other providers.
      </p>

      <h3>8. Email contact</h3>
      <p>
        If you email me, I only use your details to reply (Art. 6(1)(f) GDPR) and delete them once the matter is
        settled.
      </p>

      <h3>9. Links to other websites</h3>
      <p>
        Links to Scryfall, EDHREC, LinkedIn, GitHub and others are plain links. Data is only transferred once you click
        one, and that provider’s privacy policy applies from then on.
      </p>

      <h3>10. Your rights</h3>
      <p>
        You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of
        processing (Art. 18), data portability (Art. 20) and the <strong>right to object</strong> to processing based on
        Art. 6(1)(f) GDPR on grounds relating to your particular situation (Art. 21). An email to {mail} is enough. You
        can also lodge a complaint with a supervisory authority (Art. 77 GDPR); the competent one is the
        Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2-4, 40213
        Düsseldorf, Germany (<ExternalLink href="https://www.ldi.nrw.de" />).
      </p>

      <h3>11. Changes</h3>
      <p>
        Connections are TLS-encrypted. I update this policy when the site changes; the version published here applies.
      </p>
      <p className="pt-2 text-xs">Last updated: {LEGAL_LAST_UPDATED.en}</p>
    </Prose>
  );
}
