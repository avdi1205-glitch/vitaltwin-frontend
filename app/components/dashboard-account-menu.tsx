'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export type DiscountInfo = {
  has_grant: boolean;
  rank?: number | null;
  total_slots?: number | null;
  status?: string | null;
  discount_percent?: number | null;
  duration_months?: number | null;
  applied_at?: string | null;
};

type Props = {
  planLabel: string;
  isPremium: boolean;
  showBetaUnlock: boolean;
  discount: DiscountInfo | null;
  discountLoading: boolean;
  onProfile: () => void;
  onPasswordReset: () => void;
  onLogout: () => void;
};

function monthsRemaining(appliedAt: string, durationMonths: number): number {
  const end = new Date(appliedAt);
  end.setMonth(end.getMonth() + durationMonths);
  const diffMs = end.getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
}

/**
 * Account-Verwaltung (Plan/Beta/Rabatt-Status/Profil/Feedback/Passwort/
 * Abmelden) hinter einem einzelnen Menü-Icon, statt 6 einzelner Buttons
 * mitten im Screen -- gleiches Interaktionsmuster wie dashboard-nav.tsx's
 * Hamburger (Button + offen/geschlossen-State + aria-expanded), anderes
 * Icon (Kebab), um nicht mit dem Seiten-Navigations-Toggle verwechselt zu
 * werden.
 */
export default function DashboardAccountMenu({
  planLabel,
  isPremium,
  showBetaUnlock,
  discount,
  discountLoading,
  onProfile,
  onPasswordReset,
  onLogout,
}: Props) {
  const t = useTranslations('dashboard');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const discountLine = (() => {
    if (discountLoading) {
      return <span className="block h-4 w-40 animate-pulse rounded bg-white/10" />;
    }
    if (!discount || !discount.has_grant) return null;
    if (discount.status === 'granted' && discount.rank && discount.total_slots) {
      return <p className="mt-1 text-xs text-[#58D7D4]">{t('discountSlotSecured', { slot: discount.rank, total: discount.total_slots })}</p>;
    }
    if (isPremium && discount.status === 'applied' && discount.applied_at && discount.duration_months && discount.discount_percent) {
      const count = monthsRemaining(discount.applied_at, discount.duration_months);
      const monthWord = count === 1 ? t('monthSingular') : t('monthPlural');
      return <p className="mt-1 text-xs text-[#58D7D4]">{t('discountActiveMonths', { percent: discount.discount_percent, count, monthWord })}</p>;
    }
    return null;
  })();

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t('closeAccountMenuLabel') : t('accountMenuLabel')}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0B1118] p-4 shadow-2xl">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${isPremium ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'border border-white/20 text-[#B7BDC4]'}`}>
              {t('planLabel')} {planLabel}
            </span>
            {discountLine}
            {showBetaUnlock && (
              <Link
                href="/preise"
                onClick={() => setOpen(false)}
                className="mt-3 block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-center text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('betaUnlock')}
              </Link>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-1 text-sm font-medium text-[#F5F2EA]">
            <button onClick={() => { setOpen(false); onProfile(); }} className="rounded-xl px-3 py-2 text-left transition hover:bg-white/5 hover:text-[#58D7D4]">
              {t('navProfile')}
            </button>
            <Link href="/dashboard/mein-twin#feedback" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 transition hover:bg-white/5 hover:text-[#58D7D4]">
              {t('navFeedback')}
            </Link>
            <button onClick={() => { setOpen(false); onPasswordReset(); }} className="rounded-xl px-3 py-2 text-left transition hover:bg-white/5 hover:text-[#58D7D4]">
              {t('navPassword')}
            </button>
            <button onClick={() => { setOpen(false); onLogout(); }} className="rounded-xl px-3 py-2 text-left text-red-300 transition hover:bg-red-400/10">
              {t('navLogout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
