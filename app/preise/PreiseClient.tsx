'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import PublicFooter from '../components/PublicFooter';
import {
  BillingInterval,
  PLAN_ORDER,
  PLANS,
  PlanId,
  formatPrice,
  isPlanPurchasable,
  yearlySavingsPercent,
} from '@/lib/plans';
import { planFeatureTranslations } from '@/lib/i18n/messages';

export default function PreiseClient() {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const featureLabel = (label: string): string => (locale === 'en' ? planFeatureTranslations[label] ?? label : label);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [confirmBeta, setConfirmBeta] = useState(false);
  const [betaLoading, setBetaLoading] = useState(false);
  const [betaMessage, setBetaMessage] = useState('');

  // Global safety switch: pause all paid checkouts (e.g. during beta) without
  // touching per-plan Stripe configuration. Defaults to enabled.
  const paidCheckoutsEnabled = process.env.NEXT_PUBLIC_ENABLE_PREMIUM_CHECKOUT !== 'false';

  const extractErrorMessage = (data: unknown): string => {
    if (!data || typeof data !== 'object') {
      return t('checkoutError');
    }
    const payload = data as { detail?: unknown; message?: string };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const first = payload.detail[0] as { msg?: string };
      if (typeof first?.msg === 'string' && first.msg.trim()) {
        return first.msg;
      }
    }
    return t('checkoutError');
  };

  const startCheckout = async (plan: PlanId) => {
    setCheckoutMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.assign('/?auth=register&premium=1');
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch(apiUrl('/api/payments/create-plan-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval: billingInterval, token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setCheckoutMessage(extractErrorMessage(data));
        return;
      }
      window.location.assign(data.url);
    } catch {
      setCheckoutMessage(t('checkoutUnreachable'));
    } finally {
      setLoadingPlan(null);
    }
  };

  // Already-logged-in users clicking the Free-plan CTA should land on their
  // own dashboard, not get sent through the public registration flow again.
  const goToFreeStart = () => {
    const token = localStorage.getItem('token');
    window.location.assign(token ? '/dashboard' : '/?auth=register');
  };

  const activateFreeBeta = async () => {
    setBetaMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.assign('/?auth=register&premium=1');
      return;
    }

    setBetaLoading(true);
    try {
      const res = await fetch(apiUrl('/api/users/activate-beta'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBetaMessage(extractErrorMessage(data));
        return;
      }
      window.location.assign('/dashboard?beta=activated');
    } catch {
      setBetaMessage(t('betaUnreachable'));
    } finally {
      setBetaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA] md:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#B7BDC4]">
            {t('subtitle')}
          </p>

          <div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/[0.03] p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billingInterval === 'monthly' ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'text-[#B7BDC4]'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billingInterval === 'yearly' ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'text-[#B7BDC4]'
              }`}
            >
              {t('yearly')}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8E969F]">
            {t('yearlyHint')}
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 55% at 12% 15%, rgba(232,181,93,0.14), transparent 60%), radial-gradient(ellipse 55% 55% at 88% 85%, rgba(70,200,200,0.14), transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] sm:text-4xl">
              {t('heroTitle')}
            </h2>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-[#F3C979] to-[#58D7D4]" />

            <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
              {[t('feature1'), t('feature2'), t('feature3')].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-left text-sm text-[#F5F2EA]"
                >
                  <span className="mr-2 text-[#58D7D4]">✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tarife"
                className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-7 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('viewPremium')}
              </a>
              <a
                href="#vergleich"
                className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
              >
                {t('learnMore')}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center md:p-8">
          <p className="font-semibold text-[#F5F2EA]">{t('betaBoxTitle')}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#B7BDC4]">
            {t('betaBoxText')}
          </p>
          {!confirmBeta ? (
            <button
              onClick={() => setConfirmBeta(true)}
              className="mt-4 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('activateBeta')}
            </button>
          ) : (
            <div className="mx-auto mt-4 max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-[#F5F2EA]">
              <p>{t('betaConfirmText')}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  onClick={activateFreeBeta}
                  disabled={betaLoading}
                  className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 font-semibold text-[#0B1118] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {betaLoading ? t('activating') : t('activateNow')}
                </button>
                <button
                  onClick={() => setConfirmBeta(false)}
                  className="rounded-xl border border-white/15 px-4 py-2 font-semibold text-[#F5F2EA]"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
          {betaMessage && <p className="mt-3 text-sm text-red-300">{betaMessage}</p>}
        </div>

        <div id="tarife" className="mt-10 scroll-mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const price = billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const savings = yearlySavingsPercent(plan);
            const isFree = planId === 'free';
            const purchasable = isFree || (paidCheckoutsEnabled && isPlanPurchasable(planId, billingInterval));
            const isHighlighted = Boolean(plan.badge);

            return (
              <div
                key={planId}
                className={`relative rounded-3xl border p-7 text-[#F5F2EA] ${
                  isHighlighted ? 'border-[#F3C979]/50 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-1 text-xs font-bold text-[#0B1118]">
                    {featureLabel(plan.badge).toUpperCase()}
                  </div>
                )}
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-3 text-4xl font-bold">
                  {formatPrice(price)}
                  {price > 0 && (
                    <span className={`text-base font-medium ${isHighlighted ? 'text-[#B7BDC4]' : 'text-[#8E969F]'}`}>
                      /{billingInterval === 'monthly' ? t('monthly') : t('yearly')}
                    </span>
                  )}
                </p>
                {billingInterval === 'yearly' && savings !== null && (
                  <p className={`mt-1 text-xs font-semibold ${isHighlighted ? 'text-[#F3C979]' : 'text-[#B7BDC4]'}`}>
                    {t('save', { percent: savings })}
                  </p>
                )}

                <ul className={`mt-6 space-y-2 text-sm ${isHighlighted ? 'text-[#F5F2EA]' : 'text-[#B7BDC4]'}`}>
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2">
                      <span className={feature.status === 'coming_soon' ? 'text-[#6B7480]' : 'text-[#58D7D4]'}>
                        {feature.status === 'coming_soon' ? '○' : '✓'}
                      </span>
                      <span className={feature.status === 'coming_soon' ? 'text-[#8E969F]' : undefined}>
                        {featureLabel(feature.label)}
                      </span>
                      {feature.status === 'beta' && (
                        <span className="ml-1 rounded-full bg-[#58D7D4]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#58D7D4]">
                          Beta
                        </span>
                      )}
                      {feature.status === 'coming_soon' && (
                        <span className="ml-1 text-xs text-[#6B7480]">{t('soonLabel')}</span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isFree ? (
                    <button
                      onClick={goToFreeStart}
                      className={`block w-full rounded-2xl py-3 text-center text-sm font-semibold transition ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118] hover:brightness-110'
                          : 'border border-white/20 text-[#F5F2EA] hover:border-[#58D7D4]/60 hover:text-[#58D7D4]'
                      }`}
                    >
                      {featureLabel(plan.ctaLabel)}
                    </button>
                  ) : purchasable ? (
                    <button
                      onClick={() => startCheckout(planId)}
                      disabled={loadingPlan === planId}
                      className={`w-full rounded-2xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isHighlighted
                          ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118] hover:brightness-110'
                          : 'border border-white/20 text-[#F5F2EA] hover:border-[#58D7D4]/60 hover:text-[#58D7D4]'
                      }`}
                    >
                      {loadingPlan === planId ? t('redirecting') : featureLabel(plan.ctaLabel)}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className={`rounded-2xl border border-dashed py-3 text-center text-sm font-semibold ${
                          isHighlighted ? 'border-[#F3C979]/40 text-[#B7BDC4]' : 'border-white/15 text-[#8E969F]'
                        }`}
                      >
                        {t('comingSoon')}
                      </div>
                      <Link
                        href="/beta-bewerbung"
                        className={`block text-center text-xs underline ${
                          isHighlighted ? 'text-[#B7BDC4]' : 'text-[#8E969F]'
                        }`}
                      >
                        {t('waitlist')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {checkoutMessage && (
          <p className="mt-4 text-center text-sm text-red-300">{checkoutMessage}</p>
        )}

        <p className="mt-6 text-center text-xs text-[#8E969F]">
          {t('taxNote')}
        </p>

        <section id="vergleich" className="mt-16 scroll-mt-8">
          <h2 className="text-center font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA]">
            {t('comparisonTitle')}
          </h2>
          <div className="mt-8 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
            <table className="w-full min-w-[640px] text-left text-sm text-[#F5F2EA]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-semibold">{t('featureColumn')}</th>
                  {PLAN_ORDER.map((planId) => (
                    <th key={planId} className="p-4 font-semibold">
                      {PLANS[planId].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('aiQuestions')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">
                      {PLANS[planId].permissions.aiQuestionsPerDay}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('history')}</td>
                  {PLAN_ORDER.map((planId) => {
                    const days = PLANS[planId].permissions.historyDays;
                    return (
                      <td key={planId} className="p-4">
                        {days === 'unlimited' ? t('unlimited') : days === 'extended' ? t('extendedHist') : `${days} ${t('daysSuffix')}`}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('profiles')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.maxProfiles}</td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('ads')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasAds ? t('adsPossible') : t('adsNone')}</td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('weeklyReports')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasWeeklyReports ? '✓' : '—'}</td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-4">{t('lifestyleSims')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasLifestyleSimulations ? '✓' : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4">{t('familyFeatures')}</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasFamilyFeatures ? '✓' : '—'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#8E969F]">
            {t('comparisonNote')}
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA]">
            {t('faqTitle')}
          </h2>
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-semibold text-[#F5F2EA]">{t('faqCancelQ')}</p>
              <p className="mt-2 text-sm text-[#B7BDC4]">
                {t('faqCancelA')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-semibold text-[#F5F2EA]">{t('faqBillingQ')}</p>
              <p className="mt-2 text-sm text-[#B7BDC4]">
                {t('faqBillingA')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-semibold text-[#F5F2EA]">{t('faqChangeQ')}</p>
              <p className="mt-2 text-sm text-[#B7BDC4]">
                {t('faqChangeA')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-semibold text-[#F5F2EA]">{t('faqTaxQ')}</p>
              <p className="mt-2 text-sm text-[#B7BDC4]">
                {t('faqTaxA')}
              </p>
            </div>
          </div>
        </section>

        <PublicFooter centered />
      </div>
    </div>
  );
}
