'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import PublicFooter from '../components/PublicFooter';

export default function UeberUnsClient() {
  const t = useTranslations('ueberUns');

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <Link href="/" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          {t('backToHome')}
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">{t('badge')}</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-6 text-lg text-[#B7BDC4]">
          {t('intro')}
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('whyHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t('whyText')}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('meaningHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t('meaningText')}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">
            {t('differentHeading')}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-[#B7BDC4]">
            <li>{t('differentItem1')}</li>
            <li>{t('differentItem2')}</li>
            <li>{t('differentItem3')}</li>
            <li>{t('differentItem4')}</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('featuresHeading')}</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#B7BDC4]">
            <li>{t('featuresItem1')}</li>
            <li>{t('featuresItem2')}</li>
            <li>{t('featuresItem3')}</li>
            <li>{t('featuresItem4')}</li>
            <li>{t('featuresItem5')}</li>
            <li>{t('featuresItem6')}</li>
            <li>{t('featuresItem7')}</li>
            <li>{t('featuresItem8')}</li>
            <li>{t('featuresItem9')}</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('plannedHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t.rich('plannedText', {
              pricingLink: (chunks) => (
                <Link href="/preise" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('limitsHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t.rich('limitsText', {
              strong: (chunks) => <strong>{chunks}</strong>,
              aiLink: (chunks) => (
                <Link href="/ki-hinweise" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('whoHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t.rich('whoText', {
              imprintLink: (chunks) => (
                <Link href="/impressum" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-[#F5F2EA]">{t('contactHeading')}</h2>
          <p className="text-[#B7BDC4]">
            {t.rich('contactText', {
              contactLink: (chunks) => (
                <Link href="/kontakt" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </Link>
              ),
              emailLink: (chunks) => (
                <a href="mailto:info@vitaltwin.de" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </a>
              ),
              imprintLink: (chunks) => (
                <Link href="/impressum" className="underline hover:text-[#58D7D4]">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
