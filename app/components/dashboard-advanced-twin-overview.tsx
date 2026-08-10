'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type TrendEntry = { average: number | null; data_points: number; data_quality: string };
type BaselineItem = { field: string; message: string };
type TrendHighlight = { field: string; label: string; first_half_average: number; second_half_average: number };

type ThirtyDayDevelopment = {
  available: boolean;
  reason: string | null;
  data_points: number;
  strongest_positive_trend: TrendHighlight | null;
  strongest_negative_trend: TrendHighlight | null;
  summary: string;
};

type OverviewResponse = {
  available: boolean;
  data_points: number;
  data_quality_overview: string;
  reason: string | null;
  current_trends: Record<string, TrendEntry>;
  personal_baseline: { items: BaselineItem[]; not_yet_tracked: { field: string; message: string }[] };
  thirty_day_development: ThirtyDayDevelopment;
  active_goals: string[];
  habit_progress: string[];
  lifestyle_simulation: { available: boolean; note: string };
  twin_status_summary: string;
  disclaimer: string;
};

const FIELD_LABELS: Record<string, string> = {
  sleep_hours: 'Schlafdauer',
  movement_minutes: 'Bewegung',
  stress: 'Stress',
  energy: 'Energie',
  mood: 'Stimmung',
};

/**
 * Erweiterter digitaler Zwilling V1 (Pro/Family, Beta) — konsolidierte
 * Ansicht aus bereits bestehenden Berechnungen (Baseline/Trends/30-Tage-
 * Bericht/Ziele/Gewohnheiten), keine neue Statistik. Backend:
 * GET /api/profile/advanced-twin-overview.
 */
export default function DashboardAdvancedTwinOverview() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setForbidden(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/profile/advanced-twin-overview'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => null);
      if (response.status === 403) {
        setForbidden(true);
        setErrorMessage(data?.detail ?? 'Der erweiterte digitale Zwilling ist ein Pro-Feature.');
        return;
      }
      if (!response.ok) {
        setErrorMessage(data?.detail ?? 'Übersicht konnte nicht geladen werden.');
        return;
      }
      setOverview(data);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOverview(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          Erweiterter digitaler Zwilling
        </h3>
        <span className="rounded-full border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4]">Beta</span>
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        Eine gebündelte Übersicht, was VitalTwin bereits über dich weiß — Baseline, Trends, 30-Tage-Entwicklung,
        Ziele und Gewohnheiten an einem Ort.
      </p>

      {loading && <p className="mt-4 text-[#8E969F]">Übersicht wird geladen...</p>}

      {!loading && forbidden && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-sm text-[#F5F2EA]">{errorMessage}</p>
          <a
            href="/preise"
            className="mt-3 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            Pro ansehen
          </a>
        </div>
      )}

      {!loading && !forbidden && errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}

      {!loading && !forbidden && !errorMessage && overview && !overview.available && (
        <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
          {overview.reason ?? 'Noch nicht genügend Daten für deinen erweiterten Zwilling.'}
        </p>
      )}

      {!loading && !forbidden && !errorMessage && overview && overview.available && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-[#F5F2EA]">{overview.twin_status_summary}</p>
            <p className="mt-2 text-xs text-[#8E969F]">
              Datenqualität: {overview.data_quality_overview} · {overview.data_points} erfasste Tage
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Aktuelle Trends (7 Tage)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {Object.entries(overview.current_trends).map(([field, trend]) => (
                <div key={field} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{FIELD_LABELS[field] ?? field}</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">
                    {trend.average === null ? 'Keine Daten' : trend.average}
                  </p>
                  <p className="mt-1 text-xs text-[#8E969F]">{trend.data_points} Einträge · {trend.data_quality}</p>
                </div>
              ))}
            </div>
          </div>

          {overview.personal_baseline.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Persönliche Baseline</p>
              <div className="mt-2 space-y-2">
                {overview.personal_baseline.items.map((item) => (
                  <p key={item.field} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
                    {item.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">30-Tage-Entwicklung</p>
            {overview.thirty_day_development.available ? (
              <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
                {overview.thirty_day_development.summary}
              </p>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-sm text-[#8E969F]">
                {overview.thirty_day_development.reason ?? 'Noch nicht genügend Daten für die 30-Tage-Entwicklung.'}
              </p>
            )}
          </div>

          {overview.active_goals.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Aktive Ziele</p>
              <ul className="mt-2 space-y-1 text-sm text-[#F5F2EA]">
                {overview.active_goals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {overview.habit_progress.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Gewohnheiten</p>
              <ul className="mt-2 space-y-1 text-sm text-[#F5F2EA]">
                {overview.habit_progress.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#B7BDC4]">
            {overview.lifestyle_simulation.note}
          </p>

          <p className="text-xs text-[#8E969F]">{overview.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
