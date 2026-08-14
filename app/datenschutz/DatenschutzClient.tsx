'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import PublicFooter from '../components/PublicFooter';

function ConvenienceBanner() {
  const t = useTranslations('legalNotice');
  return (
    <div className="mb-6 rounded-xl border border-[#F3C979]/30 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
      {t('convenienceBanner')}
    </div>
  );
}

export default function DatenschutzClient() {
  const locale = useLocale();
  const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  if (locale === 'en') {
    return (
      <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Legal</p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Privacy Policy</h1>
            <ConvenienceBanner />
            <p className="mt-4 text-[#B7BDC4]">Information on the processing of personal data pursuant to the GDPR.</p>

            <div className="mt-10 space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">1. Data controller</h2>
                <p className="mt-3 text-[#B7BDC4]">VitalTwin DE, Avdi Morina, info@vitaltwin.de</p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">2. Data processed</h2>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                  <li>Account data such as name and email address</li>
                  <li>Biomarkers and inputs from the dashboard</li>
                  <li>Voluntary profile, goal, daily-life and habit information</li>
                  <li>
                    Derived, condensed summaries of your twin state over time (no duplicate raw-data storage), to
                    show you how your twin and your wellness development change over time
                  </li>
                  <li>
                    Messages to &quot;Ask your twin&quot; (only to generate the response, see AI notices) as well as
                    the number of your daily requests
                  </li>
                  <li>Technical log data for stability and security</li>
                  <li>Payment information when purchasing Premium via Stripe</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">3. Purpose and legal basis</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Processing takes place to provide the platform, to calculate your digital twin, to perform the
                  contract, and for secure payment processing. The legal basis is in particular Art. 6(1)(b) and (f)
                  GDPR.
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  The derived twin-state summaries serve exclusively for long-term personalization and to display
                  your own development over time. They are linked to your account and included in our existing
                  export and deletion architecture (see section 7).
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">4. Disclosure and service providers</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  We use carefully selected processors, each covered by a data processing agreement pursuant to Art.
                  28 GDPR or standard contractual clauses:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                  <li>Supabase (database, authentication)</li>
                  <li>Vercel (frontend hosting)</li>
                  <li>Railway (backend hosting)</li>
                  <li>Stripe (payment processing, once paid plans are active)</li>
                  <li>Resend (sending transactional emails, e.g. password reset)</li>
                  <li>
                    Sentry (error and stability monitoring for website and app, EU data processing via the
                    &quot;de.sentry.io&quot; region — see section 4b for details on which data is deliberately{' '}
                    <em>not</em> collected).
                  </li>
                  <li>
                    An AI language model provider (e.g. OpenAI), exclusively for the &quot;Ask your twin&quot;
                    feature and only with your message plus a compact summary of your own wellness data — see{' '}
                    <Link href="/ki-hinweise" className="text-[#58D7D4] hover:underline">AI notices</Link>.
                  </li>
                </ul>
                <p className="mt-3 text-[#B7BDC4]">
                  Some of these providers may also process data outside the EU/EEA (e.g. the USA). In such cases we
                  ensure an adequate level of data protection through EU standard contractual clauses or comparable
                  safeguards pursuant to Art. 44 et seq. GDPR.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">4a. Cookies and local storage</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  {adsenseEnabled
                    ? "For login, we technically necessarily store a session token in your browser's local storage (localStorage) so you stay logged in. This storage is required under German law (§ 25(2) No. 2 TTDSG) to provide the service you explicitly requested and does not require separate consent. On the free plan we additionally show advertising via Google AdSense — this loads Google advertising cookies, but only after you've explicitly agreed in the cookie banner (see section 5 below)."
                    : "We do not use marketing or advertising tracking or marketing cookies. For login, we technically necessarily store a session token in your browser's local storage (localStorage) so you stay logged in. This storage is required under German law (§ 25(2) No. 2 TTDSG) to provide the service you explicitly requested and does not require separate consent."}
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">4b. Error and stability monitoring (Sentry)</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  For technical error diagnosis and stability monitoring we use Sentry (Functional Software, Inc.,
                  with EU data processing via the &quot;de.sentry.io&quot; region). The legal basis is our
                  legitimate interest in a secure and functioning operation of the platform (Art. 6(1)(f) GDPR).
                  Sentry receives the technically unavoidable IP address of your request as well as error
                  messages/stack traces. We have deliberately disabled all additional data categories that Sentry
                  offers by default: request/response bodies, cookies, HTTP headers, URL parameters and automatic
                  user identifiers are <strong>not</strong> collected — so no health or wellness data (e.g. blood
                  glucose values, nutrition entries or twin conversations) reaches Sentry. Session replay recordings
                  (a video-like error reconstruction) mask all text and block all media content by default.
                </p>
              </section>

              {adsenseEnabled && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <h2 className="text-xl font-semibold text-[#F5F2EA]">5. Advertising (Google AdSense)</h2>
                  <p className="mt-3 text-[#B7BDC4]">
                    On the free plan we use Google AdSense (Google Ireland Limited, Gordon House, Barrow Street,
                    Dublin 4, Ireland) to display advertising. Google may process data such as IP address, device and
                    browser information and set cookies, including for personalized ad delivery. This processing
                    only takes place after you have explicitly agreed in the cookie banner (legal basis: Art.
                    6(1)(a) GDPR, § 25(1) TTDSG). Without your consent, no AdSense script is loaded. More
                    information:{' '}
                    <a
                      href="https://policies.google.com/technologies/ads"
                      className="text-[#58D7D4] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google policies on advertising technology
                    </a>
                    . Google may also process data outside the EU/EEA; an adequate level of data protection is
                    ensured via EU standard contractual clauses.
                  </p>
                </section>
              )}

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">6. Retention period</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Data is only stored for as long as necessary for the respective purposes or as required by
                  statutory retention periods.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">7. Your rights</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  You have the right to access, rectification, erasure, restriction, data portability and objection.
                  You also have the right to lodge a complaint with a data protection supervisory authority.
                </p>
              </section>
            </div>

            <PublicFooter>
              <Link href="/dashboard" className="transition hover:text-[#58D7D4]">Dashboard</Link>
              <p className="ml-auto">As of: July 2026</p>
            </PublicFooter>
          </div>
        </div>
      </main>
    );
  }

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
                <li>Abgeleitete, verdichtete Zusammenfassungen deines Twin-Zustands im Zeitverlauf (keine doppelte Rohdaten-Speicherung), um dir zu zeigen, wie sich dein Twin und deine Wellness-Entwicklung über Zeit verändern</li>
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
              <p className="mt-3 text-[#B7BDC4]">
                Die abgeleiteten Twin-Zustands-Zusammenfassungen dienen ausschließlich der langfristigen
                Personalisierung und der Darstellung deiner eigenen Entwicklung über Zeit. Sie sind deinem Konto
                zugeordnet und in unsere bestehende Export- und Lösch-Architektur eingebunden (siehe Ziffer 7).
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
                  Sentry (Fehler- und Stabilitätsüberwachung für Website und App, Datenverarbeitung in der EU
                  über die Region &quot;de.sentry.io&quot; — siehe Ziffer 4b für Details, welche Daten dabei
                  bewusst <em>nicht</em> erfasst werden).
                </li>
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
                  ? 'Zur Anmeldung speichern wir ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines Browsers, damit du eingeloggt bleibst. Diese Speicherung ist gemäß § 25 Abs. 2 Nr. 2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf keiner gesonderten Einwilligung. Im kostenlosen Tarif zeigen wir zusätzlich Werbung über Google AdSense an — dafür lädt Google Werbe-Cookies, aber ausschließlich nachdem du im Cookie-Banner ausdrücklich zugestimmt hast (siehe unten, Ziffer 5).'
                  : 'Wir setzen kein Marketing- oder Werbe-Tracking und keine Marketing-Cookies ein. Zur Anmeldung speichern wir ein Sitzungs-Token technisch notwendig im lokalen Speicher (localStorage) deines Browsers, damit du eingeloggt bleibst. Diese Speicherung ist gemäß § 25 Abs. 2 Nr. 2 TTDSG zur Bereitstellung des von dir ausdrücklich gewünschten Dienstes erforderlich und bedarf keiner gesonderten Einwilligung.'}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">4b. Fehler- und Stabilitätsüberwachung (Sentry)</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Zur technischen Fehlerdiagnose und Stabilitätsüberwachung setzen wir Sentry (Functional Software,
                Inc., mit EU-Datenverarbeitung über die Region &quot;de.sentry.io&quot;) ein. Rechtsgrundlage ist
                unser berechtigtes Interesse an einem sicheren und funktionierenden Betrieb der Plattform (Art. 6
                Abs. 1 lit. f DSGVO). Sentry erhält dabei die technisch unvermeidbare IP-Adresse deiner Anfrage
                sowie Fehlermeldungen/Stacktraces. Bewusst deaktiviert sind alle zusätzlichen Datenkategorien, die
                Sentry standardmäßig anbietet: Anfrage-/Antwortinhalte (Request- und Response-Bodies), Cookies,
                HTTP-Header, URL-Parameter und automatische Nutzerkennungen werden{' '}
                <strong>nicht</strong> erfasst — damit gelangen keine Gesundheits- oder Wellness-Daten (z. B.
                Blutzuckerwerte, Ernährungseinträge oder Twin-Gespräche) an Sentry. Session-Replay-Aufnahmen (eine
                video-ähnliche Fehler-Nachstellung) maskieren standardmäßig sämtliche Texte und blockieren alle
                Medieninhalte.
              </p>
            </section>

            {adsenseEnabled && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">5. Werbung (Google AdSense)</h2>
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
              <h2 className="text-xl font-semibold text-[#F5F2EA]">6. Speicherdauer</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke notwendig ist oder gesetzliche
                Aufbewahrungsfristen bestehen.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">7. Deine Rechte</h2>
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
