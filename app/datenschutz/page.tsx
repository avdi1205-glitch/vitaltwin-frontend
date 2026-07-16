import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz | VitalTwin',
  description: 'Datenschutzerklärung von VitalTwin gemäß DSGVO.',
};

export default function Datenschutz() {
  return (
    <main className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-900">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Datenschutzerklärung</h1>
          <p className="mt-4 text-neutral-700">Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">1. Verantwortliche Stelle</h2>
              <p className="mt-3 text-neutral-700">VitalTwin DE, Avdi Morina, info@vitaltwin.de</p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">2. Verarbeitete Daten</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-neutral-700">
                <li>Accountdaten wie Name und E-Mail-Adresse</li>
                <li>Biomarker und Eingaben aus dem Dashboard</li>
                <li>Freiwillige Profil-, Ziele-, Alltags- und Gewohnheitsangaben</li>
                <li>Nachrichten an &quot;Frag deinen Twin&quot; (nur zur Erzeugung der Antwort, siehe KI-Hinweise) sowie die Anzahl deiner täglichen Anfragen</li>
                <li>Technische Logdaten zur Stabilität und Sicherheit</li>
                <li>Zahlungsinformationen bei Premium-Abschluss über Stripe</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">3. Zweck und Rechtsgrundlagen</h2>
              <p className="mt-3 text-neutral-700">
                Die Verarbeitung erfolgt zur Bereitstellung der Plattform, zur Berechnung deines Digital Twins, zur
                Vertragserfüllung sowie zur sicheren Zahlungsabwicklung. Rechtsgrundlagen sind insbesondere Art. 6
                Abs. 1 lit. b und lit. f DSGVO.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">4. Weitergabe und Dienstleister</h2>
              <p className="mt-3 text-neutral-700">
                Wir setzen sorgfältig ausgewählte Auftragsverarbeiter ein, mit denen jeweils ein
                Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO besteht bzw. Standardvertragsklauseln vereinbart
                sind:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-neutral-700">
                <li>Supabase (Datenbank, Authentifizierung)</li>
                <li>Vercel (Hosting Frontend)</li>
                <li>Railway (Hosting Backend)</li>
                <li>Stripe (Zahlungsabwicklung, sobald kostenpflichtige Pläne aktiv sind)</li>
                <li>Resend (Versand von Transaktions-E-Mails, z. B. Passwort-Reset)</li>
                <li>
                  Ein KI-Sprachmodell-Anbieter (z. B. OpenAI), ausschließlich für die Funktion &quot;Frag deinen
                  Twin&quot; und nur mit deiner Nachricht sowie einer kompakten Zusammenfassung deiner eigenen
                  Wellness-Daten — siehe{' '}
                  <Link href="/ki-hinweise" className="text-neutral-900 hover:underline">KI-Hinweise</Link>.
                </li>
              </ul>
              <p className="mt-3 text-neutral-700">
                Einige dieser Dienstleister können Daten auch außerhalb der EU/des EWR verarbeiten (z. B. USA). In
                diesen Fällen stellen wir ein angemessenes Datenschutzniveau durch EU-Standardvertragsklauseln oder
                vergleichbare Garantien gemäß Art. 44 ff. DSGVO sicher.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">4a. Cookies und lokale Speicherung</h2>
              <p className="mt-3 text-neutral-700">
                Wir setzen kein Tracking und keine Marketing-Cookies ein. Zur Anmeldung speichern wir ein
                Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines Browsers, damit du
                eingeloggt bleibst. Diese Speicherung ist gemäß § 25 Abs. 2 Nr. 2 TTDSG zur Bereitstellung des von dir
                ausdrücklich gewünschten Dienstes erforderlich und bedarf keiner gesonderten Einwilligung.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">5. Speicherdauer</h2>
              <p className="mt-3 text-neutral-700">
                Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke notwendig ist oder gesetzliche
                Aufbewahrungsfristen bestehen.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-6">
              <h2 className="text-xl font-semibold text-neutral-900">6. Deine Rechte</h2>
              <p className="mt-3 text-neutral-700">
                Du hast Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und
                Widerspruch. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
              </p>
            </section>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
            <Link href="/" className="transition hover:text-black">Startseite</Link>
            <Link href="/dashboard" className="transition hover:text-black">Dashboard</Link>
            <Link href="/impressum" className="transition hover:text-black">Impressum</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-black">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-black">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-black">KI-Hinweise</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </div>
        </div>
      </div>
    </main>
  );
}