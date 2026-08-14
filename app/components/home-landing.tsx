'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import HomeAuthModal from './home-auth-modal';
import SiteNav from './site-nav';
import VitalTwinHero from './hero/VitalTwinHero';

type AuthMode = 'login' | 'register' | null;

type HomeLandingProps = {
  initialAuthMode: AuthMode;
  initialNotice: string;
  startedFromQuery: boolean;
};

export default function HomeLanding({
  initialAuthMode,
  initialNotice,
  startedFromQuery,
}: HomeLandingProps) {
  const t = useTranslations('home');
  const tFooter = useTranslations('footer');
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode);
  const [notice, setNotice] = useState(initialNotice);
  const router = useRouter();

  useEffect(() => {
    // Supabase password-recovery links always redirect to the configured Site URL
    // (this homepage) with the tokens in the URL hash, regardless of the requested
    // redirect_to path. Forward recovery links to the page that can consume them.
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token=')) {
      router.replace(`/passwort-bestaetigen${hash}`);
    }
  }, [router]);

  const openAuth = (mode: Exclude<AuthMode, null>) => {
    setNotice('');
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
    setNotice('');
    if (startedFromQuery) {
      router.replace('/', { scroll: false });
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      {authMode && <HomeAuthModal mode={authMode} onClose={closeAuth} initialNotice={notice} />}

      <SiteNav onOpenLogin={() => openAuth('login')} onOpenRegister={() => openAuth('register')} />

      <VitalTwinHero onOpenRegister={() => openAuth('register')} />

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.3em] text-[#8E969F]">{t('different')}</p>
          <h2 className="mt-3 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('grows')}</h2>
          <p className="mt-4 max-w-2xl text-[#B7BDC4]">
            {t('differentText')}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-[#F3C979]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F3C979]">{t('learnDaily')}</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('learnDailyText')}</p>
            </article>
            <article className="rounded-2xl border border-[#58D7D4]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#58D7D4]">{t('understandHistory')}</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('understandHistoryText')}</p>
            </article>
            <article className="rounded-2xl border border-[#F3C979]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#F3C979]">{t('connectData')}</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('connectDataText')}</p>
            </article>
            <article className="rounded-2xl border border-[#58D7D4]/25 bg-white/[0.03] p-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs font-semibold uppercase tracking-[0.2em] text-[#58D7D4]">{t('explainInsights')}</p>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('explainInsightsText')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('howItWorks')}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">01</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">{t('dataDecision')}</h3>
            <p className="mt-3 text-[#B7BDC4]">{t('dataDecisionText')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">02</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">{t('baseline')}</h3>
            <p className="mt-3 text-[#B7BDC4]">{t('baselineText')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">03</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">{t('learnsOverTime')}</h3>
            <p className="mt-3 text-[#B7BDC4]">{t('learnsOverTimeText')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#8E969F]">04</p>
            <h3 className="mt-2 text-xl font-semibold text-[#F5F2EA]">{t('patterns')}</h3>
            <p className="mt-3 text-[#B7BDC4]">{t('patternsText')}</p>
          </div>
        </div>
      </section>

      <section id="funktionen" className="border-y border-white/10 bg-white/[0.02] scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('dailyOverview')}</h2>
          <p className="mt-3 max-w-2xl text-[#B7BDC4]">
            {t('overviewText')}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('categorySleep')}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('categoryMovement')}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('categoryNutrition')}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('categoryStress')}</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('categoryRecovery')}</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('twinTitle')}</h2>
            <p className="mt-4 text-[#B7BDC4]">
              {t('twinText')}
            </p>
            <p className="mt-4 text-[#B7BDC4]">
              {t('noDiagnosis')}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{t('exampleViewLabel')}</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>{t('exampleSleepQuality')}</span>
                <span className="font-semibold text-[#58D7D4]">{t('exampleImproved')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>{t('exampleMovementWeek')}</span>
                <span className="font-semibold text-[#58D7D4]">{t('exampleOnTrack')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-[#F5F2EA]">
                <span>{t('exampleStressLevel')}</span>
                <span className="font-semibold text-[#F3C979]">{t('exampleObserve')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('why')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('allInOne')}</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('allInOneText')}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('clearView')}</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('clearViewText')}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('longTerm')}</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('longTermText')}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-[#F5F2EA]">{t('personalGoals')}</h3>
              <p className="mt-3 text-sm text-[#B7BDC4]">{t('personalGoalsText')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('pricingOverviewTitle')}</h2>
          <Link href="/preise" className="text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            {t('viewPricing')} →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="text-xl font-semibold text-[#F5F2EA]">{t('planFreeTitle')}</h3>
            <p className="mt-2 text-3xl font-bold text-[#F5F2EA]">{t('planFreePrice')}</p>
            <p className="mt-3 text-sm text-[#B7BDC4]">{t('planFreeText')}</p>
          </div>
          <div className="rounded-3xl border border-[#F3C979]/50 bg-white/[0.06] p-7 text-[#F5F2EA]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F3C979]">{t('planBetaRecommended')}</p>
            <h3 className="mt-2 text-xl font-semibold">{t('planBetaTitle')}</h3>
            <p className="mt-2 text-3xl font-bold">{t('planBetaPrice')}</p>
            <p className="mt-3 text-sm text-[#B7BDC4]">{t('planBetaText')}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="text-xl font-semibold text-[#F5F2EA]">{t('planPremiumTitle')}</h3>
            <p className="mt-2 text-3xl font-bold text-[#F5F2EA]">{t('planPremiumPrice')}<span className="text-base font-medium text-[#8E969F]">{t('planPremiumPeriod')}</span></p>
            <p className="mt-3 text-sm text-[#B7BDC4]">{t('planPremiumText')}</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-[#B7BDC4]">
          {t('higherNeedsPrefix')} <span className="font-semibold text-[#F5F2EA]">{t('higherNeedsPro')}</span> {t('higherNeedsProNote')}{' '}
          <span className="font-semibold text-[#F5F2EA]">{t('higherNeedsFamily')}</span> {t('higherNeedsFamilyNote')}{' '}
          <Link href="/preise" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">{t('viewPricing')}</Link>.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('ready')}</h2>
          <p className="mt-4 max-w-2xl text-[#B7BDC4]">
            {t('readyText')}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => openAuth('register')}
              className="rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-8 py-4 font-semibold text-[#0B1118] transition hover:brightness-110"
            >
              {t('register')}
            </button>
            <button
              onClick={() => openAuth('login')}
              className="rounded-2xl border border-white/20 px-8 py-4 font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('login')}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 md:pb-24">
        <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">{t('faq')}</h2>
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">{t('questionFree')}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">{t('answerFree')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">{t('questionMedical')}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">{t('answerMedical')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">{t('questionDoctor')}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">{t('answerDoctor')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">{t('questionData')}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              {t('answerData')}{' '}
              <Link href="/datenschutz" className="underline hover:text-[#58D7D4]">{t('privacyPolicyLink')}</Link>.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-semibold text-[#F5F2EA]">{t('questionDelete')}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">{t('answerDelete')}</p>
          </div>
        </div>
        <Link href="/faq" className="mt-6 inline-block text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
          {t('viewAllFaq')}
        </Link>
      </section>

      <footer className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[#8E969F]">
          <p>VitalTwin DE</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/ueber-uns" className="transition hover:text-[#58D7D4]">{tFooter('about')}</Link>
            <Link href="/blog" className="transition hover:text-[#58D7D4]">{tFooter('blog')}</Link>
            <Link href="/faq" className="transition hover:text-[#58D7D4]">{tFooter('faq')}</Link>
            <Link href="/beta-bewerbung" className="transition hover:text-[#58D7D4]">{tFooter('betaApplication')}</Link>
            <Link href="/preise" className="transition hover:text-[#58D7D4]">{tFooter('pricing')}</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">{tFooter('legal')}</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">{tFooter('privacy')}</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">{tFooter('terms')}</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">{tFooter('withdrawal')}</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">{tFooter('cookies')}</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">{tFooter('ai')}</Link>
            <Link href="/kontakt" className="transition hover:text-[#58D7D4]">{tFooter('contact')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
