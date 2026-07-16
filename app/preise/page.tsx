'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '@/lib/api';
import {
  BillingInterval,
  PLAN_ORDER,
  PLANS,
  PlanId,
  formatPrice,
  isPlanPurchasable,
  yearlySavingsPercent,
} from '@/lib/plans';

export default function Preise() {
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
      return 'Checkout konnte nicht gestartet werden.';
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
    return 'Checkout konnte nicht gestartet werden.';
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
      setCheckoutMessage('Checkout gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoadingPlan(null);
    }
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
      setBetaMessage('Beta-Aktivierung gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setBetaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-serif-display)] text-4xl font-semibold md:text-5xl">
            Wähle deinen Tarif
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Freemium-Modell: kostenlos starten, jederzeit upgraden oder wieder zurückstufen.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-neutral-300 bg-white p-1">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billingInterval === 'monthly' ? 'bg-black text-white' : 'text-neutral-700'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billingInterval === 'yearly' ? 'bg-black text-white' : 'text-neutral-700'
              }`}
            >
              Jährlich
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Beim Jahresabo sparst du im Vergleich zur monatlichen Zahlung.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 text-center md:p-8">
          <p className="font-semibold text-neutral-900">Aktuell in der Beta-Phase</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
            Aktiviere kostenlos den Beta-Zugang: unbegrenzte Simulationen und Verlauf, keine automatische Zahlung,
            keine Kreditkarte nötig.
          </p>
          {!confirmBeta ? (
            <button
              onClick={() => setConfirmBeta(true)}
              className="mt-4 rounded-full border border-neutral-900 px-6 py-3 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
            >
              Beta-Zugang aktivieren
            </button>
          ) : (
            <div className="mx-auto mt-4 max-w-md rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-4 text-sm">
              <p>Du startest kostenlos als Tester. Keine automatische Zahlung, keine Kreditkarte.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  onClick={activateFreeBeta}
                  disabled={betaLoading}
                  className="rounded-xl bg-black px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {betaLoading ? 'Aktiviere...' : 'Jetzt kostenlos aktivieren'}
                </button>
                <button
                  onClick={() => setConfirmBeta(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 font-semibold"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
          {betaMessage && <p className="mt-3 text-sm text-red-600">{betaMessage}</p>}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                className={`relative rounded-3xl border p-7 ${
                  isHighlighted ? 'border-neutral-900 bg-black text-white' : 'border-neutral-200 bg-white'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-5 py-1 text-xs font-bold text-black">
                    {plan.badge.toUpperCase()}
                  </div>
                )}
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-3 text-4xl font-bold">
                  {formatPrice(price)}
                  {price > 0 && (
                    <span className={`text-base font-medium ${isHighlighted ? 'text-white/70' : 'text-neutral-500'}`}>
                      /{billingInterval === 'monthly' ? 'Monat' : 'Jahr'}
                    </span>
                  )}
                </p>
                {billingInterval === 'yearly' && savings !== null && (
                  <p className={`mt-1 text-xs font-semibold ${isHighlighted ? 'text-white/80' : 'text-neutral-600'}`}>
                    Spare {savings}% ggü. monatlicher Zahlung
                  </p>
                )}

                <ul className={`mt-6 space-y-2 text-sm ${isHighlighted ? 'text-white/90' : 'text-neutral-700'}`}>
                  {plan.features.map((feature) => (
                    <li key={feature.label}>
                      ✓ {feature.label}
                      {feature.comingSoon && (
                        <span className={`ml-1 text-xs ${isHighlighted ? 'text-white/60' : 'text-neutral-400'}`}>
                          (bald verfügbar)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isFree ? (
                    <Link
                      href="/?auth=register"
                      className={`block rounded-2xl py-3 text-center text-sm font-semibold transition ${
                        isHighlighted
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'border border-neutral-900 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      {plan.ctaLabel}
                    </Link>
                  ) : purchasable ? (
                    <button
                      onClick={() => startCheckout(planId)}
                      disabled={loadingPlan === planId}
                      className={`w-full rounded-2xl py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isHighlighted
                          ? 'bg-white text-black hover:bg-neutral-200'
                          : 'border border-neutral-900 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      {loadingPlan === planId ? 'Leite weiter...' : plan.ctaLabel}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className={`rounded-2xl border border-dashed py-3 text-center text-sm font-semibold ${
                          isHighlighted ? 'border-white/40 text-white/70' : 'border-neutral-300 text-neutral-500'
                        }`}
                      >
                        Demnächst verfügbar
                      </div>
                      <Link
                        href="/beta-bewerbung"
                        className={`block text-center text-xs underline ${
                          isHighlighted ? 'text-white/70' : 'text-neutral-500'
                        }`}
                      >
                        Für die Warteliste eintragen
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {checkoutMessage && (
          <p className="mt-4 text-center text-sm text-red-600">{checkoutMessage}</p>
        )}

        <p className="mt-6 text-center text-xs text-neutral-500">
          Alle Preise verstehen sich zzgl. der jeweils geltenden Steuern; diese können je nach Land abweichen.
        </p>

        <section className="mt-16">
          <h2 className="text-center font-[family-name:var(--font-serif-display)] text-3xl font-semibold">
            Tarife im Vergleich
          </h2>
          <div className="mt-8 overflow-x-auto rounded-3xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="p-4 font-semibold">Funktion</th>
                  {PLAN_ORDER.map((planId) => (
                    <th key={planId} className="p-4 font-semibold">
                      {PLANS[planId].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">KI-Fragen pro Tag</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">
                      {PLANS[planId].permissions.aiQuestionsPerDay === 'fair-unlimited'
                        ? 'Fair begrenzt'
                        : PLANS[planId].permissions.aiQuestionsPerDay}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">Verlauf</td>
                  {PLAN_ORDER.map((planId) => {
                    const days = PLANS[planId].permissions.historyDays;
                    return (
                      <td key={planId} className="p-4">
                        {days === 'unlimited' ? 'Unbegrenzt' : days === 'extended' ? 'Erweitert' : `${days} Tage`}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">Profile</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.maxProfiles}</td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">Werbung</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasAds ? 'Möglich' : 'Keine'}</td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">Wochenberichte</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasWeeklyReports ? '✓' : '—'}</td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="p-4">Lifestyle-Simulationen</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasLifestyleSimulations ? '✓' : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4">Familienfunktionen</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4">{PLANS[planId].permissions.hasFamilyFeatures ? '✓' : '—'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Simulationen sind Wellness-Szenarien und keine medizinischen Vorhersagen. Mit &bdquo;(bald verfügbar)&ldquo;
            markierte Funktionen befinden sich noch in der Entwicklung.
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center font-[family-name:var(--font-serif-display)] text-3xl font-semibold">
            Häufige Fragen zu Preisen
          </h2>
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="font-semibold text-neutral-900">Kann ich jederzeit kündigen?</p>
              <p className="mt-2 text-sm text-neutral-700">
                Ja. Bezahlte Tarife sind jederzeit kündbar, die Kündigung wirkt zum Ende des laufenden
                Abrechnungszeitraums.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="font-semibold text-neutral-900">Wie funktioniert die Abrechnung?</p>
              <p className="mt-2 text-sm text-neutral-700">
                Die Zahlung erfolgt sicher über Stripe, monatlich oder jährlich im Voraus, je nach gewähltem
                Abrechnungszeitraum. Es gibt keine versteckten Zusatzkosten.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="font-semibold text-neutral-900">Kann ich meinen Tarif später wechseln?</p>
              <p className="mt-2 text-sm text-neutral-700">
                Ja, ein Wechsel zwischen den Tarifen ist jederzeit möglich. Kontaktiere uns dafür einfach unter
                info@vitaltwin.de.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="font-semibold text-neutral-900">Fallen zusätzliche Steuern an?</p>
              <p className="mt-2 text-sm text-neutral-700">
                Die angezeigten Preise können je nach Land abweichende gesetzliche Steuern beinhalten oder
                zusätzlich ausweisen. Details siehst du vor Zahlungsabschluss bei Stripe.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-5 border-t border-neutral-200 pt-8 text-sm text-neutral-500">
          <Link href="/" className="transition hover:text-black">Startseite</Link>
          <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
          <Link href="/agb" className="transition hover:text-black">AGB (Nutzungsbedingungen)</Link>
          <Link href="/widerrufsrecht" className="transition hover:text-black">Widerrufsrecht</Link>
          <Link href="/cookie-einstellungen" className="transition hover:text-black">Cookie-Einstellungen</Link>
          <Link href="/ki-hinweise" className="transition hover:text-black">KI-Hinweise</Link>
          <Link href="/impressum" className="transition hover:text-black">Impressum</Link>
        </div>
      </div>
    </div>
  );
}
