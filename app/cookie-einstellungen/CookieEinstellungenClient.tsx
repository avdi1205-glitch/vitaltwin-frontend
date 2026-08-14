'use client';

import { useTranslations } from 'next-intl';
import PublicFooter from '../components/PublicFooter';

export default function CookieEinstellungenClient({ adsenseEnabled }: { adsenseEnabled: boolean }) {
  const t = useTranslations('cookieSettings');

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8E969F]">{t('badge')}</p>
          <h1 className="mt-3 text-4xl font-bold text-[#F5F2EA] md:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-[#B7BDC4]">
            {adsenseEnabled ? t('introWithAds') : t('introNoAds')}
          </p>

          <div className="mt-10 space-y-6">
            {adsenseEnabled ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">{t('adsHeading')}</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  {t('adsText')}
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">{t('noMarketingHeading')}</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  {t('noMarketingText')}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-xl font-semibold text-[#F5F2EA]">{t('technicalHeading')}</h2>
              <p className="mt-3 text-[#B7BDC4]">
                {t('technicalText')}
              </p>
            </section>

            {!adsenseEnabled && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <h2 className="text-xl font-semibold text-[#F5F2EA]">{t('futureHeading')}</h2>
                <p className="mt-3 text-[#B7BDC4]">
                  {t('futureText')}
                </p>
              </section>
            )}
          </div>

          <PublicFooter>
            <p className="ml-auto">{t('lastUpdated')}</p>
          </PublicFooter>
        </div>
      </div>
    </main>
  );
}
