'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import PublicFooter from '../components/PublicFooter';

type FaqItem = { q: string; a: React.ReactNode };
type FaqGroup = { heading: string; items: FaqItem[] };

export default function FaqClient() {
  const t = useTranslations('faq');

  const linkTags = {
    pricingLink: (chunks: React.ReactNode) => (
      <Link href="/preise" className="underline hover:text-[#58D7D4]">
        {chunks}
      </Link>
    ),
    privacyLink: (chunks: React.ReactNode) => (
      <Link href="/datenschutz" className="underline hover:text-[#58D7D4]">
        {chunks}
      </Link>
    ),
    cookieLink: (chunks: React.ReactNode) => (
      <Link href="/cookie-einstellungen" className="underline hover:text-[#58D7D4]">
        {chunks}
      </Link>
    ),
    betaLink: (chunks: React.ReactNode) => (
      <Link href="/beta-bewerbung" className="underline hover:text-[#58D7D4]">
        {chunks}
      </Link>
    ),
    contactLink: (chunks: React.ReactNode) => (
      <Link href="/kontakt" className="underline hover:text-[#58D7D4]">
        {chunks}
      </Link>
    ),
    emailLink: (chunks: React.ReactNode) => (
      <a href="mailto:info@vitaltwin.de" className="underline hover:text-[#58D7D4]">
        {chunks}
      </a>
    ),
  };

  const groups: FaqGroup[] = [
    {
      heading: t('groupBasics'),
      items: [
        { q: t('basicsQ1'), a: t('basicsA1') },
        { q: t('basicsQ2'), a: t('basicsA2') },
        { q: t('basicsQ3'), a: t('basicsA3') },
        { q: t('basicsQ4'), a: t('basicsA4') },
        { q: t('basicsQ5'), a: t('basicsA5') },
      ],
    },
    {
      heading: t('groupPricing'),
      items: [
        { q: t('pricingQ1'), a: t.rich('pricingA1', linkTags) },
        { q: t('pricingQ2'), a: t('pricingA2') },
        { q: t('pricingQ3'), a: t('pricingA3') },
        { q: t('pricingQ4'), a: t('pricingA4') },
        { q: t('pricingQ5'), a: t('pricingA5') },
      ],
    },
    {
      heading: t('groupPrivacy'),
      items: [
        { q: t('privacyQ1'), a: t('privacyA1') },
        { q: t('privacyQ2'), a: t.rich('privacyA2', linkTags) },
        { q: t('privacyQ3'), a: t('privacyA3') },
        { q: t('privacyQ4'), a: t('privacyA4') },
        { q: t('privacyQ5'), a: t('privacyA5') },
        { q: t('privacyQ6'), a: t('privacyA6') },
        { q: t('privacyQ7'), a: t('privacyA7') },
        { q: t('privacyQ8'), a: t.rich('privacyA8', linkTags) },
      ],
    },
    {
      heading: t('groupWearables'),
      items: [
        { q: t('wearablesQ1'), a: t('wearablesA1') },
        { q: t('wearablesQ2'), a: t('wearablesA2') },
        { q: t('wearablesQ3'), a: t('wearablesA3') },
        { q: t('wearablesQ4'), a: t('wearablesA4') },
      ],
    },
    {
      heading: t('groupAi'),
      items: [
        { q: t('aiQ1'), a: t('aiA1') },
        { q: t('aiQ2'), a: t('aiA2') },
        { q: t('aiQ3'), a: t('aiA3') },
      ],
    },
    {
      heading: t('groupBetaFuture'),
      items: [
        { q: t('betaFutureQ1'), a: t.rich('betaFutureA1', linkTags) },
        { q: t('betaFutureQ2'), a: t('betaFutureA2') },
        { q: t('betaFutureQ3'), a: t.rich('betaFutureA3', linkTags) },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <Link href="/" className="text-sm font-medium text-[#8E969F] transition hover:text-[#58D7D4]">
          {t('backToHome')}
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#8E969F]">{t('pageBadge')}</p>
        <h1 className="mt-3 font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
          {t('pageTitle')}
        </h1>
        <p className="mt-4 max-w-2xl text-[#B7BDC4]">
          {t('pageIntro')}
        </p>

        <div className="mt-12 space-y-10">
          {groups.map((group) => (
            <section key={group.heading}>
              <h2 className="text-xl font-semibold text-[#F5F2EA]">{group.heading}</h2>
              <div className="mt-4 space-y-4">
                {group.items.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="font-semibold text-[#F5F2EA]">{item.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#B7BDC4]">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <PublicFooter className="mt-16" />
      </div>
    </main>
  );
}
