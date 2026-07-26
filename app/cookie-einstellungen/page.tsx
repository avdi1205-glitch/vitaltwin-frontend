import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Einstellungen | VitalTwin',
  description: 'Übersicht zu Cookies und lokaler Speicherung bei VitalTwin.',
};

export default function CookieEinstellungen() {
  const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Cookie-Einstellungen</h1>
          <p className="mt-4 text-[#B7BDC4]">
            Übersicht, welche Speicherung auf deinem Gerät stattfindet{adsenseEnabled ? '.' : ' und warum keine Einwilligungsabfrage nötig ist.'}
          </p>

          <div className="mt-10 space-y-6">
            {adsenseEnabled ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Werbung (Google AdSense)</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Im kostenlosen Tarif zeigen wir Werbung über Google AdSense an. Dafür lädt Google Werbe-Cookies
                  und verarbeitet Daten zur Anzeigenauslieferung — aber nur, nachdem du dem im Banner am unteren
                  Bildschirmrand ausdrücklich zugestimmt hast. Ohne deine Zustimmung wird kein Werbe-Skript
                  geladen. Deine Entscheidung wird lokal in deinem Browser gespeichert; du kannst sie jederzeit
                  ändern, indem du den lokalen Speicher deines Browsers für diese Seite löschst.
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Keine Marketing- oder Analyse-Cookies</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  VitalTwin setzt aktuell keine Werbe-Cookies, kein Drittanbieter-Tracking und keine Analyse-Dienste
                  (z. B. Google Analytics, Facebook Pixel, AdSense) ein. Es gibt daher aktuell keinen
                  Cookie-Consent-Banner, da keine einwilligungspflichtigen Dienste geladen werden.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Technisch notwendige Speicherung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Zur Anmeldung wird ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines
                Browsers abgelegt, damit du eingeloggt bleibst. Optional legst du selbst über &quot;Gewohnheiten&quot;
                im Dashboard weitere Einträge lokal in deinem Browser an. Diese Speicherung ist gemäß § 25 Abs. 2 Nr.
                2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf
                keiner gesonderten Einwilligung.
              </p>
            </section>

            {!adsenseEnabled && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Wenn sich das ändert</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Sollten künftig einwilligungspflichtige Dienste (z. B. Analyse- oder Marketing-Tools) hinzukommen,
                  wird an dieser Stelle ein Einwilligungsdialog ergänzt, bevor solche Dienste geladen werden. Diese
                  Seite wird dann entsprechend aktualisiert.
                </p>
              </section>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6 text-sm text-[#8E969F]">
            <Link href="/" className="transition hover:text-[#58D7D4]">Startseite</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">Impressum</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">AGB</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
