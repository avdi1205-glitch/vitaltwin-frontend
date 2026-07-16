import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Einstellungen | VitalTwin',
  description: 'Übersicht zu Cookies und lokaler Speicherung bei VitalTwin.',
};

export default function CookieEinstellungen() {
  return (
    <main className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-900">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Cookie-Einstellungen</h1>
          <p className="mt-4 text-neutral-700">
            Übersicht, welche Speicherung auf deinem Gerät stattfindet und warum keine Einwilligungsabfrage nötig ist.
          </p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Keine Marketing- oder Analyse-Cookies</h2>
              <p className="mt-3 text-neutral-700">
                VitalTwin setzt aktuell keine Werbe-Cookies, kein Drittanbieter-Tracking und keine Analyse-Dienste
                (z. B. Google Analytics, Facebook Pixel, AdSense) ein. Es gibt daher aktuell keinen
                Cookie-Consent-Banner, da keine einwilligungspflichtigen Dienste geladen werden.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Technisch notwendige Speicherung</h2>
              <p className="mt-3 text-neutral-700">
                Zur Anmeldung wird ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines
                Browsers abgelegt, damit du eingeloggt bleibst. Optional legst du selbst über &quot;Gewohnheiten&quot;
                im Dashboard weitere Einträge lokal in deinem Browser an. Diese Speicherung ist gemäß § 25 Abs. 2 Nr.
                2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf
                keiner gesonderten Einwilligung.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Wenn sich das ändert</h2>
              <p className="mt-3 text-neutral-700">
                Sollten künftig einwilligungspflichtige Dienste (z. B. Analyse- oder Marketing-Tools) hinzukommen,
                wird an dieser Stelle ein Einwilligungsdialog ergänzt, bevor solche Dienste geladen werden. Diese
                Seite wird dann entsprechend aktualisiert.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
            <Link href="/" className="transition hover:text-black">Startseite</Link>
            <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
            <Link href="/impressum" className="transition hover:text-black">Impressum</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}
