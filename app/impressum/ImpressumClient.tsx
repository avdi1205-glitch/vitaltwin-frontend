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

export default function ImpressumClient() {
  const locale = useLocale();

  if (locale === 'en') {
    return (
      <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">Legal</p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Legal Notice</h1>
            <ConvenienceBanner />
            <p className="mt-4 text-[#B7BDC4]">Information pursuant to § 5 TMG and § 18 (2) MStV (German law).</p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Provider</h2>
                <div className="mt-3 space-y-1 text-[#F5F2EA]">
                  <p className="font-semibold">VitalTwin DE</p>
                  <p>Avdi Morina</p>
                  <p>Klepsauerstr. 60</p>
                  <p>74677 Dörzbach</p>
                  <p>Germany</p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">Contact</h2>
                <div className="mt-3 space-y-2 text-[#F5F2EA]">
                  <p>
                    <span className="font-semibold">Email:</span> info@vitaltwin.de
                  </p>
                  <p>
                    <span className="font-semibold">Contact form:</span>{' '}
                    <Link href="/kontakt" className="text-[#58D7D4] underline hover:text-[#F3C979]">
                      vitaltwin.de/kontakt
                    </Link>
                  </p>
                  <p>
                    <span className="font-semibold">VAT ID:</span> DE45336207810
                  </p>
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Responsible for content</h2>
              <p className="mt-3 text-[#F5F2EA]">Avdi Morina, address as above.</p>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Liability notice</h2>
              <p className="mt-3 text-[#B7BDC4]">
                Despite careful content control, we assume no liability for the content of external links. The
                operators of the linked pages are solely responsible for their content.
              </p>
            </section>

            <PublicFooter>
              <p className="ml-auto">Applies to www.vitaltwin.de</p>
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
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">Impressum</h1>
          <p className="mt-4 text-[#B7BDC4]">Angaben gemäß § 5 TMG und § 18 Abs. 2 MStV.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Anbieter</h2>
              <div className="mt-3 space-y-1 text-[#F5F2EA]">
                <p className="font-semibold">VitalTwin DE</p>
                <p>Avdi Morina</p>
                <p>Klepsauerstr. 60</p>
                <p>74677 Dörzbach</p>
                <p>Deutschland</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">Kontakt</h2>
              <div className="mt-3 space-y-2 text-[#F5F2EA]">
                <p>
                  <span className="font-semibold">E-Mail:</span> info@vitaltwin.de
                </p>
                <p>
                  <span className="font-semibold">Kontaktformular:</span>{' '}
                  <Link href="/kontakt" className="text-[#58D7D4] underline hover:text-[#F3C979]">
                    vitaltwin.de/kontakt
                  </Link>
                </p>
                <p>
                  <span className="font-semibold">USt-IdNr.:</span> DE45336207810
                </p>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-[#F5F2EA]">Verantwortlich für den Inhalt</h2>
            <p className="mt-3 text-[#F5F2EA]">Avdi Morina, Anschrift wie oben.</p>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-semibold text-[#F5F2EA]">Haftungshinweis</h2>
            <p className="mt-3 text-[#B7BDC4]">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.
              Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
          </section>

          <PublicFooter>
            <p className="ml-auto">Gilt für www.vitaltwin.de</p>
          </PublicFooter>
        </div>
      </div>
    </main>
  );
}
