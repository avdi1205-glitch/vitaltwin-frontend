'use client';

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

export default function WiderrufsrechtClient() {
  const locale = useLocale();

  if (locale === 'en') {
    return (
      <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Legal</p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Right of Withdrawal</h1>
            <ConvenienceBanner />
            <p className="mt-4 text-[#B7BDC4]">Applies to consumers within the meaning of § 13 BGB (German Civil Code).</p>

            <div className="mt-10 space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Right of withdrawal</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  You have the right to withdraw from this contract within fourteen days without giving any reason.
                  The withdrawal period is fourteen days from the day of the conclusion of the contract.
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  To exercise your right of withdrawal, you must inform us:
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, Germany, email:{' '}
                  <a href="mailto:info@vitaltwin.de" className="text-[#58D7D4] hover:underline">info@vitaltwin.de</a>
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  by means of a clear statement (e.g. a letter sent by post or an email) of your decision to
                  withdraw from this contract. You may use the model withdrawal form below, although this is not
                  mandatory.
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  To meet the withdrawal deadline, it is sufficient for you to send your notice concerning your
                  exercise of the right of withdrawal before the withdrawal period has expired.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Effects of withdrawal</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  If you withdraw from this contract, we shall reimburse to you all payments received from you
                  without undue delay and in any event not later than fourteen days from the day on which we are
                  informed about your decision to withdraw from this contract. We will use the same means of
                  payment as you used for the original transaction, unless expressly agreed otherwise; in any
                  event, you will not incur any fees as a result of such reimbursement.
                </p>
                <p className="mt-3 text-[#B7BDC4]">
                  If you requested that use of the platform should begin already during the withdrawal period, you
                  shall pay us an amount which is in proportion to what has been provided until you have
                  communicated to us your withdrawal from this contract, in comparison with the full coverage of
                  the contract.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Note on the beta phase</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  The Free plan and any active Beta Tester access (90 days of VitalTwin Pro after application and
                  approval) are free of charge; since no payment is made in these cases, no financial claims arise
                  from a withdrawal. For paid Premium, Pro or Family subscriptions, the withdrawal notice above
                  applies in full from the conclusion of the contract.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Model withdrawal form</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  (If you want to withdraw from the contract, please fill out this form and send it back to us.)
                </p>
                <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.03] p-5 font-mono text-sm text-[#B7BDC4]">
                  <p>To: VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, Germany, info@vitaltwin.de</p>
                  <p className="mt-3">
                    I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the use of the
                    VitalTwin platform.
                  </p>
                  <p className="mt-3">Ordered on / received on: _______________</p>
                  <p className="mt-1">Name of consumer(s): _______________</p>
                  <p className="mt-1">Address of consumer(s): _______________</p>
                  <p className="mt-3">Signature of consumer(s) (only if this form is notified on paper): _______________</p>
                  <p className="mt-1">Date: _______________</p>
                  <p className="mt-3">(*) Delete as appropriate.</p>
                </div>
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
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Widerrufsbelehrung</h1>
          <p className="mt-4 text-[#B7BDC4]">Gilt für Verbraucherinnen und Verbraucher im Sinne des § 13 BGB.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Widerrufsrecht</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
                Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mt-3 text-[#B7BDC4]">
                Um dein Widerrufsrecht auszuüben, musst du uns
              </p>
              <p className="mt-3 text-[#B7BDC4]">
                VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, E-Mail:{' '}
                <a href="mailto:info@vitaltwin.de" className="text-[#58D7D4] hover:underline">info@vitaltwin.de</a>
              </p>
              <p className="mt-3 text-[#B7BDC4]">
                mittels einer eindeutigen Erklärung (z. B. per Post versandter Brief oder E-Mail) über deinen
                Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende
                Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
              </p>
              <p className="mt-3 text-[#B7BDC4]">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
                Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Folgen des Widerrufs</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Wenn du diesen Vertrag widerrufst, erstatten wir dir alle Zahlungen, die wir von dir erhalten haben,
                unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an dem die Mitteilung über
                deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel,
                das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, ausdrücklich wurde etwas
                anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.
              </p>
              <p className="mt-3 text-[#B7BDC4]">
                Hast du verlangt, dass die Nutzung der Plattform bereits während der Widerrufsfrist beginnen soll, so
                hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du
                uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichtest, bereits
                erbrachten Leistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Leistungen
                entspricht.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Hinweis zur Beta-Phase</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Der Free-Tarif und ein etwaiger aktiver Beta-Tester-Zugang (90 Tage VitalTwin Pro nach Bewerbung und
                Freigabe) sind kostenlos; da hierfür keine Zahlung erfolgt, entstehen dir in diesen Fällen aus
                einem Widerruf keine finanziellen Ansprüche. Für kostenpflichtige Premium-, Pro- oder
                Family-Abonnements gilt die obenstehende Widerrufsbelehrung uneingeschränkt ab Vertragsschluss.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Muster-Widerrufsformular</h2>
              <p className="mt-3 text-[#B7BDC4]">
                (Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es an uns zurück.)
              </p>
              <div className="mt-4 rounded-xl border border-white/15 bg-white/[0.03] p-5 font-mono text-sm text-[#B7BDC4]">
                <p>An: VitalTwin DE, Avdi Morina, Klepsauerstr. 60, 74677 Dörzbach, info@vitaltwin.de</p>
                <p className="mt-3">
                  Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Nutzung der
                  VitalTwin-Plattform.
                </p>
                <p className="mt-3">Bestellt am / erhalten am: _______________</p>
                <p className="mt-1">Name des/der Verbraucher(s): _______________</p>
                <p className="mt-1">Anschrift des/der Verbraucher(s): _______________</p>
                <p className="mt-3">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _______________</p>
                <p className="mt-1">Datum: _______________</p>
              </div>
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
