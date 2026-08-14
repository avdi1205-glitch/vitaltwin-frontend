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

export default function KiHinweiseClient() {
  const locale = useLocale();

  if (locale === 'en') {
    return (
      <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Legal</p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">AI Notices</h1>
            <ConvenienceBanner />
            <p className="mt-4 text-[#B7BDC4]">Information on the &quot;Ask your twin&quot; feature.</p>

            <div className="mt-10 space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Not a doctor, not medical professional</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  &quot;Ask your twin&quot; is a personal wellness assistant based on an AI language model. It does
                  not make diagnoses, does not recommend or change medication, does not state dosages, and does not
                  replace medical advice. For health concerns or medical questions, please consult qualified
                  medical professionals.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">AI answers may contain errors</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Answers are generated automatically by a language model and can be inaccurate or wrong. You decide
                  yourself which recommendations to implement.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">What data is used</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Your message, together with a compact summary of your own, voluntarily entered wellness goals,
                  active habits and (depending on plan) recent daily-life values, is sent to an external AI provider
                  to generate a response. No complete database contents and no data from other users are
                  transmitted.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Storage</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  Currently only how often you have used the feature per day is stored (to enforce your daily
                  limit) — not the content of your messages or answers.
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Usage limits</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  A daily limit on requests applies depending on your plan. See the{' '}
                  <Link href="/preise" className="text-[#58D7D4] hover:underline">pricing page</Link> for details.
                </p>
              </section>
            </div>

            <PublicFooter>
              <Link href="/frag-deinen-twin" className="transition hover:text-[#58D7D4]">Ask your twin</Link>
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
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">KI-Hinweise</h1>
          <p className="mt-4 text-[#B7BDC4]">Informationen zur Funktion &quot;Frag deinen Twin&quot;.</p>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Kein Arzt, kein medizinisches Fachpersonal</h2>
              <p className="mt-3 text-[#B7BDC4]">
                &quot;Frag deinen Twin&quot; ist ein persönlicher Wellness-Assistent auf Basis eines
                KI-Sprachmodells. Er stellt keine Diagnosen, empfiehlt oder verändert keine Medikamente, nennt keine
                Dosierungen und ersetzt keine ärztliche Beratung. Bei gesundheitlichen Beschwerden oder medizinischen
                Fragen wende dich bitte an qualifiziertes medizinisches Fachpersonal.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">KI-Antworten können Fehler enthalten</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Antworten werden automatisiert von einem Sprachmodell erzeugt und können ungenau oder falsch sein. Du
                entscheidest selbst, welche Empfehlungen du umsetzt.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Welche Daten werden verwendet</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Deine Nachricht sowie eine kompakte Zusammenfassung deiner eigenen, freiwillig eingetragenen
                Wellness-Ziele, aktiven Gewohnheiten und (je nach Tarif) jüngsten Alltagswerte werden an einen
                externen KI-Anbieter übermittelt, um eine Antwort zu erzeugen. Es werden keine vollständigen
                Datenbankinhalte und keine Daten anderer Nutzer übermittelt.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Speicherung</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Aktuell wird nur gespeichert, wie oft du die Funktion pro Tag genutzt hast (zur Einhaltung deines
                Tageslimits) — nicht der Inhalt deiner Nachrichten oder Antworten.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Nutzungslimits</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Je nach Tarif gilt ein tägliches Limit an Anfragen. Details siehe{' '}
                <Link href="/preise" className="text-[#58D7D4] hover:underline">Preise-Seite</Link>.
              </p>
            </section>
          </div>

          <PublicFooter>
            <Link href="/frag-deinen-twin" className="transition hover:text-[#58D7D4]">Frag deinen Twin</Link>
            <p className="ml-auto">Stand: Juli 2026</p>
          </PublicFooter>
        </div>
      </div>
    </main>
  );
}
