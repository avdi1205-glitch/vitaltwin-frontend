'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type TrendWindow = { average: number | null; data_points: number; data_quality: string };
type TrendsResponse = {
  trends: Record<string, { '7d': TrendWindow; '30d': TrendWindow; '90d'?: TrendWindow }>;
  extended_history: boolean;
  disclaimer: string;
};

const FIELD_LABELS: Record<string, string> = {
  mood: 'Stimmung',
  energy: 'Energie',
  stress: 'Stress',
  sleep_quality: 'Schlafqualität',
  sleep_hours: 'Schlafdauer (h)',
  recovery: 'Erholung',
  movement_minutes: 'Bewegung (Min.)',
};

type WindowKey = '7d' | '30d' | '90d';
const WINDOW_LABELS: Record<WindowKey, string> = { '7d': '7 Tage', '30d': '30 Tage', '90d': '90 Tage' };
const WINDOW_DAYS: Record<WindowKey, number> = { '7d': 7, '30d': 30, '90d': 90 };

/**
 * Sleep/Movement/Stress-Recovery trend display (Twin Intelligence Core,
 * Etappe 3 §2-4). Shows only transparent averages computed server-side
 * (`app/services/trends.py`) — no interpretation, no diagnosis. Rendered
 * only once enough real check-ins exist, per "keine erfundenen Fortschritte".
 * Zeitraum-Auswahl (7/30/90 Tage) spiegelt exakt die vom Backend gelieferten
 * Fenster wider — 90 Tage ist nur wählbar, wenn `extended_history` (Premium/
 * Pro/Family) tatsächlich vom Server bestätigt wurde.
 */
export default function DashboardTrends() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedWindow, setSelectedWindow] = useState<WindowKey>('7d');

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/profile/trends'), { headers: authHeader() });
        const json = await response.json().catch(() => null);
        if (response.ok) {
          setData(json as TrendsResponse);
        } else {
          setErrorMessage('Trends konnten nicht geladen werden.');
        }
      } catch {
        setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeader]);

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">Lade Trends...</p>
      </article>
    );
  }

  if (errorMessage) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Trends (7 Tage)</h3>
        <p className="mt-2 text-sm text-red-300">{errorMessage}</p>
      </article>
    );
  }

  if (!data) {
    return null;
  }

  const hasExtendedHistory = data.extended_history;
  const availableWindows: WindowKey[] = hasExtendedHistory ? ['7d', '30d', '90d'] : ['7d', '30d'];
  const title = hasExtendedHistory ? 'Trends — Erweiterter Verlauf (bis zu 90 Tage)' : 'Trends (bis zu 30 Tage)';

  const visibleFields = Object.entries(data.trends).filter(
    ([, window]) => (window[selectedWindow]?.data_points ?? 0) > 0
  );
  const windowDays = WINDOW_DAYS[selectedWindow];
  const coverage = visibleFields.reduce(
    (max, [, window]) => Math.max(max, window[selectedWindow]?.data_points ?? 0),
    0
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{title}</h3>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Zeitraum">
        {availableWindows.map((windowKey) => (
          <button
            key={windowKey}
            type="button"
            role="tab"
            aria-selected={selectedWindow === windowKey}
            onClick={() => setSelectedWindow(windowKey)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              selectedWindow === windowKey
                ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]'
                : 'border border-white/15 text-[#B7BDC4] hover:border-[#58D7D4]/60'
            }`}
          >
            {WINDOW_LABELS[windowKey]}
          </button>
        ))}
      </div>

      {visibleFields.length === 0 ? (
        <p className="mt-4 text-sm text-[#B7BDC4]">
          {selectedWindow === '90d'
            ? 'Für den 90-Tage-Zeitraum liegen noch keine Daten vor. Mit regelmäßigen Check-ins baut dein Twin deinen persönlichen Verlauf auf. Dein Tarif ermöglicht dir bereits jetzt Zugriff auf bis zu 90 Tage Verlauf.'
            : 'Noch keine Trends verfügbar. Fülle ein paar Tage lang deinen Check-in aus, um hier Verläufe zu sehen.'}
        </p>
      ) : (
        <>
          {coverage < windowDays && (
            <p className="mt-3 text-xs text-[#8E969F]">
              Für diesen Zeitraum {coverage === 1 ? 'liegt bisher nur 1 Tag' : `liegen bisher nur ${coverage} Tage`} mit Daten vor.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleFields.map(([field, window]) => {
              const value = window[selectedWindow];
              if (!value) return null;
              return (
                <div key={field} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                  <p className="text-xs text-[#8E969F]">{FIELD_LABELS[field] ?? field}</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{value.average}</p>
                  <p className="text-[10px] text-[#6B7480]">{WINDOW_LABELS[selectedWindow]}</p>
                  {value.data_quality === 'partial' && (
                    <p className="mt-1 text-[10px] text-[#6B7480]">wenig Daten ({value.data_points}x)</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-[#8E969F]">{data.disclaimer}</p>
    </article>
  );
}
