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

export default function AgbClient() {
  const locale = useLocale();

  if (locale === 'en') {
    return (
      <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Legal</p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Terms and Conditions</h1>
            <ConvenienceBanner />
            <p className="mt-4 text-[#B7BDC4]">Applicable to the use of the VitalTwin platform (www.vitaltwin.de).</p>

            <div className="mt-10 space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">1. Scope and provider</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  These Terms and Conditions apply to the use of the VitalTwin platform, offered by Avdi Morina,
                  Klepsauerstr. 60, 74677 Dörzbach, Germany (&quot;Provider&quot;). By registering, you accept these
                  Terms and Conditions.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">2. Description of services</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  VitalTwin is a wellness tool for general health guidance. VitalTwin is{' '}
                  <strong>not a medical device</strong> within the meaning of Regulation (EU) 2017/745 (MDR) and
                  does not replace a medical diagnosis, consultation or therapy. The calculated values (e.g.
                  &quot;biological age&quot;) are indicative wellness metrics without medical significance. For
                  health concerns, always consult a physician.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">3. Registration and user account</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Use requires registration with correct information. You are obligated to keep your access
                  credentials confidential and to inform us immediately of any misuse of your account.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">4. Prices, beta phase and payment</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  The Free plan is free to use forever. Premium, Pro and Family are paid subscriptions that exist
                  now and are billed via Stripe, as described on the{' '}
                  <Link href="/preise" className="text-[#58D7D4] hover:underline">pricing page</Link>. Independently
                  of this, you can apply for the Beta Tester Program; once reviewed and approved, selected beta
                  testers receive 90 days of VitalTwin Pro for free, with no automatic charge during that period.
                  After the 90 days, the terms published on the pricing page at that time apply to any further use
                  of paid plans; you will be informed in advance of any price changes.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">5. Term and termination</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  You may terminate your account at any time without giving reasons by sending an email to{' '}
                  <a href="mailto:info@vitaltwin.de" className="text-[#58D7D4] hover:underline">info@vitaltwin.de</a>.
                  For paid subscriptions, the respective agreed notice periods as stated on the pricing page apply.
                  Consumers additionally have a statutory right of withdrawal — see our{' '}
                  <Link href="/widerrufsrecht" className="text-[#58D7D4] hover:underline">right of withdrawal</Link> notice.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">6. User obligations</h2>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                  <li>Providing truthful information during registration</li>
                  <li>No abusive or unlawful use of the platform</li>
                  <li>No sharing of your own account with third parties</li>
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">7. Limitation of liability</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  The Provider is liable without limitation for intent and gross negligence, as well as under
                  product liability law. In case of slightly negligent breach of material contractual obligations
                  (cardinal obligations), liability is limited to the typical, foreseeable damage. Otherwise,
                  liability for slight negligence is excluded. VitalTwin&rsquo;s wellness recommendations do not
                  constitute medical advice; liability for health-related decisions based on the app is excluded to
                  the extent permitted by law.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">8. Changes to these Terms</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  The Provider may amend these Terms with effect for the future, insofar as this is necessary to
                  adapt to changed legal or technical circumstances. You will be informed of material changes in a
                  timely manner.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">9. Final provisions</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  The law of the Federal Republic of Germany applies, excluding the UN Convention on Contracts for
                  the International Sale of Goods. Mandatory consumer-protection provisions of your habitual
                  residence remain unaffected. Should any provision of these Terms be invalid, the validity of the
                  remaining provisions remains unaffected.
                </p>
              </section>
            </div>

            <PublicFooter>
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
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Allgemeine Geschäftsbedingungen</h1>
          <p className="mt-4 text-[#B7BDC4]">Gültig für die Nutzung der VitalTwin-Plattform (www.vitaltwin.de).</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">1. Geltungsbereich und Anbieter</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform VitalTwin,
                angeboten von Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach (&quot;Anbieter&quot;). Mit der Registrierung
                erkennst du diese AGB an.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">2. Leistungsbeschreibung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                VitalTwin ist ein Wellness-Tool zur allgemeinen Gesundheitsorientierung. VitalTwin ist{' '}
                <strong>kein Medizinprodukt</strong>{' '}
                im Sinne der Verordnung (EU) 2017/745 (MDR) und ersetzt keine ärztliche Diagnose, Beratung oder
                Therapie. Die berechneten Werte (z. B. &quot;biologisches Alter&quot;) sind
                orientierende Wellness-Kennzahlen ohne medizinischen Aussagewert. Bei gesundheitlichen Beschwerden
                wende dich immer an eine Ärztin oder einen Arzt.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">3. Registrierung und Nutzerkonto</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Für die Nutzung ist eine Registrierung mit korrekten Angaben erforderlich. Du bist verpflichtet,
                deine Zugangsdaten geheim zu halten und uns über eine missbräuchliche Nutzung deines Kontos
                unverzüglich zu informieren.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">4. Preise, Beta-Phase und Zahlung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Der Free-Tarif ist dauerhaft kostenlos nutzbar. Premium, Pro und Family sind kostenpflichtige
                Abonnements, die real existieren und über Stripe abgerechnet werden, wie auf der{' '}
                <Link href="/preise" className="text-[#58D7D4] hover:underline">Preise-Seite</Link> beschrieben.
                Unabhängig davon kannst du dich für das Beta-Tester-Programm bewerben; nach Prüfung und Freigabe
                erhalten ausgewählte Beta-Tester 90 Tage VitalTwin Pro kostenlos, ohne automatische Abbuchung für
                diesen Zeitraum. Nach Ablauf der 90 Tage gelten die zu diesem Zeitpunkt auf der Preise-Seite
                veröffentlichten Konditionen für eine weitere Nutzung kostenpflichtiger Tarife; über
                Preisänderungen wirst du vorab informiert.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">5. Laufzeit und Kündigung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Du kannst dein Konto jederzeit ohne Angabe von Gründen kündigen, indem du eine E-Mail an{' '}
                <a href="mailto:info@vitaltwin.de" className="text-[#58D7D4] hover:underline">info@vitaltwin.de</a>{' '}
                sendest. Bei kostenpflichtigen Abonnements gelten die jeweils vereinbarten Kündigungsfristen laut
                Preise-Seite. Verbraucherinnen und Verbrauchern steht zusätzlich ein gesetzliches Widerrufsrecht zu
                — siehe unsere{' '}
                <Link href="/widerrufsrecht" className="text-[#58D7D4] hover:underline">Widerrufsbelehrung</Link>.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">6. Pflichten der Nutzer</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-[#B7BDC4]">
                <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
                <li>Keine missbräuchliche oder rechtswidrige Nutzung der Plattform</li>
                <li>Keine Weitergabe des eigenen Kontos an Dritte</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">7. Haftungsbeschränkung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach dem
                Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten
                (Kardinalpflichten) ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im
                Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen. Die Wellness-Empfehlungen von
                VitalTwin stellen keine medizinische Beratung dar; eine Haftung für gesundheitliche Entscheidungen
                auf Basis der App ist ausgeschlossen, soweit gesetzlich zulässig.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">8. Änderungen der AGB</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, sofern dies zur Anpassung an
                geänderte rechtliche oder technische Rahmenbedingungen erforderlich ist. Über wesentliche Änderungen
                wirst du rechtzeitig informiert.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">9. Schlussbestimmungen</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende
                verbraucherschützende Vorschriften deines gewöhnlichen Aufenthaltsorts bleiben unberührt. Sollte eine
                Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
            </section>
          </div>

          <PublicFooter>
            <p className="ml-auto">Stand: Juli 2026</p>
          </PublicFooter>
        </div>
      </div>
    </main>
  );
}
