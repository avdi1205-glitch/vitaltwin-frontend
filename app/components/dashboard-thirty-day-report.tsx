'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type TrendEntry = { average: number | null; data_points: number; data_quality: string };
type BaselineItem = { field: string; message: string };
type TrendHighlight = { field: string; label: string; first_half_average: number; second_half_average: number };

type ReportResponse = {
  available: boolean;
  data_points: number;
  period_days: number;
  reason: string | null;
  coverage_ratio: number | null;
  trends: Record<string, TrendEntry>;
  baseline_comparison: BaselineItem[];
  goal_progress: string[];
  habit_progress: string[];
  consistency_patterns: string[];
  strongest_positive_trend: TrendHighlight | null;
  strongest_negative_trend: TrendHighlight | null;
  summary: string;
  disclaimer: string;
};

const FIELD_LABELS: Record<string, string> = {
  sleep_hours: 'Schlafdauer',
  energy: 'Energie',
  movement_minutes: 'Bewegung',
  stress: 'Stress',
  mood: 'Stimmung',
};

/**
 * 30-Tage-Bericht ("Erweiterte Berichte", Pro/Family) —
 * assembliert bestehende Monthly-Progress- und Baseline-Berechnungen, keine
 * neue Statistik-Engine. Backend: GET /api/profile/reports/30-day.
 */
export default function DashboardThirtyDayReport() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    setForbidden(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/profile/reports/30-day'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => null);
      if (response.status === 403) {
        setForbidden(true);
        setErrorMessage(data?.detail ?? 'Der 30-Tage-Bericht ist ein Pro-Feature.');
        return;
      }
      if (!response.ok) {
        setErrorMessage(data?.detail ?? '30-Tage-Bericht konnte nicht geladen werden.');
        return;
      }
      setReport(data);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">30-Tage-Bericht</h2>
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        Eine Zusammenfassung deiner letzten 30 Tage auf Basis deiner eigenen Daten — keine medizinische Bewertung.
      </p>

      {loading && <p className="mt-4 text-[#8E969F]">Bericht wird geladen...</p>}

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

      {!loading && !forbidden && !errorMessage && report && !report.available && (
        <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
          {report.reason ?? 'Noch nicht genügend Daten für einen vollständigen Bericht.'}
        </p>
      )}

      {!loading && !forbidden && !errorMessage && report && report.available && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-[#F5F2EA]">{report.summary}</p>
            <p className="mt-2 text-xs text-[#8E969F]">
              Datenabdeckung: {report.data_points} von {report.period_days} Tagen
              {report.coverage_ratio !== null ? ` (${Math.round(report.coverage_ratio * 100)}%)` : ''}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(report.trends).map(([field, trend]) => (
              <div key={field} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{FIELD_LABELS[field] ?? field}</p>
                <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">
                  {trend.average === null ? 'Keine Daten' : trend.average}
                </p>
                <p className="mt-1 text-xs text-[#8E969F]">{trend.data_points} Einträge · {trend.data_quality}</p>
              </div>
            ))}
          </div>

          {(report.strongest_positive_trend || report.strongest_negative_trend) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {report.strongest_positive_trend && (
                <div className="rounded-xl border border-[#58D7D4]/30 bg-white/[0.02] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#58D7D4]">Stärkste positive Entwicklung</p>
                  <p className="mt-1 text-sm text-[#F5F2EA]">
                    {report.strongest_positive_trend.label}: {report.strongest_positive_trend.first_half_average} →{' '}
                    {report.strongest_positive_trend.second_half_average}
                  </p>
                </div>
              )}
              {report.strongest_negative_trend && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#B7BDC4]">Stärkste rückläufige Entwicklung</p>
                  <p className="mt-1 text-sm text-[#F5F2EA]">
                    {report.strongest_negative_trend.label}: {report.strongest_negative_trend.first_half_average} →{' '}
                    {report.strongest_negative_trend.second_half_average}
                  </p>
                </div>
              )}
            </div>
          )}

          {report.baseline_comparison.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Vergleich mit deiner Baseline</p>
              <div className="mt-2 space-y-2">
                {report.baseline_comparison.map((item) => (
                  <p key={item.field} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
                    {item.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {report.habit_progress.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Gewohnheiten</p>
              <ul className="mt-2 space-y-1 text-sm text-[#F5F2EA]">
                {report.habit_progress.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.goal_progress.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Ziele</p>
              <ul className="mt-2 space-y-1 text-sm text-[#F5F2EA]">
                {report.goal_progress.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {report.consistency_patterns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Wiederkehrende Muster</p>
              <ul className="mt-2 space-y-1 text-sm text-[#F5F2EA]">
                {report.consistency_patterns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-[#8E969F]">{report.disclaimer}</p>
        </div>
      )}
    </article>
  );
}
