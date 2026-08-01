import Link from 'next/link';
import type { Metadata } from 'next';
import PublicFooter from '../components/PublicFooter';

export const metadata: Metadata = {
  title: 'Datenschutz | VitalTwin',
  description: 'Datenschutzerklärung von VitalTwin gemäß DSGVO.',
};

export default function Datenschutz() {
  const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Rechtliches</p>
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Datenschutzerklärung</h1>
          <p className="mt-4 text-[#B7BDC4]">Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">1. Verantwortliche Stelle</h2>
              <p className="mt-3 text-[#B7BDC4]">VitalTwin DE, Avdi Morina, info@vitaltwin.de</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">2. Verarbeitete Daten</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                <li>Accountdaten wie Name und E-Mail-Adresse</li>
                <li>Biomarker und Eingaben aus dem Dashboard</li>
                <li>Freiwillige Profil-, Ziele-, Alltags- und Gewohnheitsangaben</li>
                <li>Nachrichten an &quot;Frag deinen Twin&quot; (nur zur Erzeugung der Antwort, siehe KI-Hinweise) sowie die Anzahl deiner täglichen Anfragen</li>
                <li>Technische Logdaten zur Stabilität und Sicherheit</li>
                <li>Zahlungsinformationen bei Premium-Abschluss über Stripe</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">3. Zweck und Rechtsgrundlagen</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Die Verarbeitung erfolgt zur Bereitstellung der Plattform, zur Berechnung deines Digital Twins, zur
                Vertragserfüllung sowie zur sicheren Zahlungsabwicklung. Rechtsgrundlagen sind insbesondere Art. 6
                Abs. 1 lit. b und lit. f DSGVO.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">4. Weitergabe und Dienstleister</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Wir setzen sorgfältig ausgewählte Auftragsverarbeiter ein, mit denen jeweils ein
                Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO besteht bzw. Standardvertragsklauseln vereinbart
                sind:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                <li>Supabase (Datenbank, Authentifizierung)</li>
                <li>Vercel (Hosting Frontend)</li>
                <li>Railway (Hosting Backend)</li>
                <li>Stripe (Zahlungsabwicklung, sobald kostenpflichtige Pläne aktiv sind)</li>
                <li>Resend (Versand von Transaktions-E-Mails, z. B. Passwort-Reset)</li>
                <li>
                  Ein KI-Sprachmodell-Anbieter (z. B. OpenAI), ausschließlich für die Funktion &quot;Frag deinen
                  Twin&quot; und nur mit deiner Nachricht sowie einer kompakten Zusammenfassung deiner eigenen
                  Wellness-Daten — siehe{' '}
                  <Link href="/ki-hinweise" className="text-[#58D7D4] hover:underline">KI-Hinweise</Link>.
                </li>
              </ul>
              <p className="mt-3 text-[#B7BDC4]">
                Einige dieser Dienstleister können Daten auch außerhalb der EU/des EWR verarbeiten (z. B. USA). In
                diesen Fällen stellen wir ein angemessenes Datenschutzniveau durch EU-Standardvertragsklauseln oder
                vergleichbare Garantien gemäß Art. 44 ff. DSGVO sicher.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">4a. Cookies und lokale Speicherung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                {adsenseEnabled
                  ? 'Zur Anmeldung speichern wir ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines Browsers, damit du eingeloggt bleibst. Diese Speicherung ist gemäß § 25 Abs. 2 Nr. 2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf keiner gesonderten Einwilligung. Im kostenlosen Tarif zeigen wir zusätzlich Werbung über Google AdSense an — dafür lädt Google Werbe-Cookies, aber ausschließlich nachdem du im Cookie-Banner ausdrücklich zugestimmt hast (siehe unten, Ziffer 7).'
                  : 'Wir setzen kein Tracking und keine Marketing-Cookies ein. Zur Anmeldung speichern wir ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines Browsers, damit du eingeloggt bleibst. Diese Speicherung ist gemäß § 25 Abs. 2 Nr. 2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf keiner gesonderten Einwilligung.'}
              </p>
            </section>

            {adsenseEnabled && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">7. Werbung (Google AdSense)</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Im kostenlosen Tarif nutzen wir Google AdSense (Google Ireland Limited, Gordon House, Barrow
                  Street, Dublin 4, Irland) zur Anzeige von Werbung. Google kann dabei Daten wie IP-Adresse,
                  Geräte- und Browserinformationen verarbeiten und Cookies setzen, auch zur personalisierten
                  Anzeigenauslieferung. Diese Verarbeitung findet ausschließlich statt, nachdem du im
                  Cookie-Banner ausdrücklich zugestimmt hast (Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO, § 25
                  Abs. 1 TTDSG). Ohne deine Zustimmung wird kein AdSense-Skript geladen. Weitere Informationen:{' '}
                  <a
                    href="https://policies.google.com/technologies/ads"
                    className="text-[#58D7D4] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google-Richtlinien zu Werbetechnologien
                  </a>
                  . Google kann Daten auch außerhalb der EU/des EWR verarbeiten; ein angemessenes
                  Datenschutzniveau wird über EU-Standardvertragsklauseln sichergestellt.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">5. Speicherdauer</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke notwendig ist oder gesetzliche
                Aufbewahrungsfristen bestehen.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">6. Deine Rechte</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Du hast Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und
                Widerspruch. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
              </p>
            </section>
          </div>

          <PublicFooter>
            <Link href="/dashboard" className="transition hover:text-[#58D7D4]">Dashboard</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </PublicFooter>
        </div>
      </div>
    </main>
  );
}