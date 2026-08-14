'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

type TwinEvolutionResponse = {
  available: boolean;
  active_domain_count: number;
  data_quality_summary: Record<string, number>;
  snapshot_recorded: boolean;
  comparison: {
    available: boolean;
    reason: string | null;
    compared_from: string | null;
    explanations: string[];
  };
  baseline_history: {
    available: boolean;
    reason: string | null;
    fields: Record<string, { earlier_average: number | null; current_average: number | null; delta: number | null }>;
  };
  disclaimer: string;
};

type FieldKey = 'fieldSleep' | 'fieldEnergy' | 'fieldMovement' | 'fieldStress' | 'fieldMood';
const FIELD_KEYS: Record<string, FieldKey> = {
  sleep_hours: 'fieldSleep',
  energy: 'fieldEnergy',
  movement_minutes: 'fieldMovement',
  stress: 'fieldStress',
  mood: 'fieldMood',
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Twin Core Phase 7 — "Wie sich dein Twin entwickelt": kleine, kundensichere
 * Zusammenfassung der longitudinalen Twin-State-Snapshots
 * (GET /api/profile/twin-evolution) — nie rohe Snapshot-Daten, nie
 * medizinische Bewertung.
 */
export default function DashboardTwinEvolution() {
  const t = useTranslations('evolution');
  const locale = useLocale();
  const [data, setData] = useState<TwinEvolutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/profile/twin-evolution?locale=${locale}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body: TwinEvolutionResponse | null = await response.json().catch(() => null);
      if (!response.ok || !body) {
        setErrorMessage(t('loadError'));
        return;
      }
      setData(body);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [t, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const baselineFields = data?.baseline_history.available
    ? Object.entries(data.baseline_history.fields).filter(([, v]) => v.delta !== null)
    : [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
        {t('title')}
      </h3>
      <p className="mt-2 text-sm text-[#8E969F]">
        {t('description')}
      </p>

      {loading && <p className="mt-4 text-sm text-[#8E969F]">{t('loading')}</p>}
      {!loading && errorMessage && <p className="mt-3 text-xs text-red-300">{errorMessage}</p>}

      {!loading && data && !data.available && (
        <p className="mt-4 text-sm text-[#B7BDC4]">
          {t('empty')}
        </p>
      )}

      {!loading && data && data.available && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-[#F5F2EA]">
              {t('activeDomains', { count: data.active_domain_count })}
            </p>
          </div>

          {data.comparison.available && data.comparison.explanations.length > 0 ? (
            <div className="rounded-xl border border-[#58D7D4]/30 bg-white/[0.02] p-4">
              <p className="text-sm font-semibold text-[#F5F2EA]">
                {(() => {
                  const dateLabel = formatDate(data.comparison.compared_from);
                  return dateLabel ? t('sinceDate', { date: dateLabel }) : t('sinceLast');
                })()}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[#B7BDC4]">
                {data.comparison.explanations.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[#B7BDC4]">
              {data.comparison.reason ?? t('noChange')}
            </p>
          )}

          {baselineFields.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-semibold text-[#F5F2EA]">{t('baselineHistory')}</p>
              <ul className="mt-2 space-y-1 text-sm text-[#B7BDC4]">
                {baselineFields.map(([field, values]) => (
                  <li key={field}>
                    {FIELD_KEYS[field] ? t(FIELD_KEYS[field]) : field}: {values.earlier_average} → {values.current_average}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && data && <p className="mt-4 text-xs text-[#8E969F]">{data.disclaimer}</p>}
    </div>
  );
}
