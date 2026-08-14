'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import DashboardTrends from '../../components/dashboard-trends';
import DashboardPersonalBaseline from '../../components/dashboard-personal-baseline';
import DashboardThirtyDayReport from '../../components/dashboard-thirty-day-report';
import DashboardTwinProgress from '../../components/dashboard-twin-progress';
import { useDashboardShell } from '../dashboard-shell';

type HistoryItem = {
  id: number;
  created_at: string;
  biologisches_alter: number;
  differenz: number;
  hba1c: number;
  crp: number;
  vitamin_d: number;
  apob: number;
};

/**
 * Verlauf: persönlicher Verlauf, Trends 7/30/90 Tage, persönliche Baseline,
 * Wochenrückblick/Monatsübersicht — alles, was zeitliche Entwicklung zeigt.
 * Lädt die VOLLE Historie (limit=8) — bewusst nur hier, nicht mehr bei jedem
 * /dashboard-Aufruf.
 */
export default function VerlaufPage() {
  const { profile, loadingProfile } = useDashboardShell();
  const t = useTranslations('verlauf');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [progressCounts, setProgressCounts] = useState({ week: 0, month: 0 });

  const fetchHistory = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/twin/history?limit=8'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => null)) as { items?: HistoryItem[] } | null;
      if (response.ok) {
        setHistory(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const timer = window.setTimeout(() => void fetchHistory(token), 0);
    return () => window.clearTimeout(timer);
  }, [fetchHistory]);

  useEffect(() => {
    const now = Date.now();
    const week = history.filter((item) => now - new Date(item.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
    const month = history.filter((item) => now - new Date(item.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgressCounts({ week, month });
  }, [history]);

  return (
    <section className="mt-8 scroll-mt-24">
      <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA] md:text-3xl">
        {t('title')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
        {t('subtitle')}
      </p>
      <p className="mt-2 text-sm">
        <Link href="/dashboard/mein-twin" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
          {t('twinDevLink')}
        </Link>
      </p>

      <div className="mt-6 space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('personalHistory')}</h2>
          <p className="mt-2 text-sm text-[#8E969F]">{t('lastCalcs')}</p>

          {!loadingProfile && profile && !profile.premium && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[#F5F2EA]">
              {t('betaUnlocked')}
            </p>
          )}

          {loadingHistory && profile?.premium && <p className="mt-4 text-[#8E969F]">{t('loading')}</p>}

          {!loadingHistory && profile?.premium && history.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
              {t('empty')}
            </p>
          )}

          {!loadingHistory && profile?.premium && history.length > 0 && (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm text-[#8E969F]">
                    <span>{new Date(item.created_at).toLocaleString('de-DE')}</span>
                    <span>{item.differenz > 0 ? '+' : ''}{item.differenz} {t('yearsSuffix')}</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{t('bioAgeLabel')} {item.biologisches_alter} {t('yearsSuffix')}</p>
                  <p className="mt-1 text-xs text-[#8E969F]">HbA1c {item.hba1c} • CRP {item.crp} • Vitamin D {item.vitamin_d} • ApoB {item.apob}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <DashboardTrends />
        <DashboardPersonalBaseline />
        <DashboardThirtyDayReport />
        <DashboardTwinProgress />

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('progressTitle')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm text-[#8E969F]">{t('calcsWeek')}</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{progressCounts.week}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm text-[#8E969F]">{t('calcsMonth')}</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{progressCounts.month}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm text-[#8E969F]">{t('goalAchievement')}</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{t('noGoalSet')}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
