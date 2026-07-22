'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type TrendWindow = { average: number | null; data_points: number; data_quality: string };
type TrendsResponse = { trends: Record<string, { '7d': TrendWindow; '30d': TrendWindow }>; disclaimer: string };

const FIELD_LABELS: Record<string, string> = {
  mood: 'Stimmung',
  energy: 'Energie',
  stress: 'Stress',
  sleep_quality: 'Schlafqualität',
  sleep_hours: 'Schlafdauer (h)',
  recovery: 'Erholung',
  movement_minutes: 'Bewegung (Min.)',
};

/**
 * Sleep/Movement/Stress-Recovery trend display (Twin Intelligence Core,
 * Etappe 3 §2-4). Shows only transparent 7-day averages computed server-side
 * (`app/services/trends.py`) — no interpretation, no diagnosis. Rendered
 * only once enough real check-ins exist, per "keine erfundenen Fortschritte".
 */
export default function DashboardTrends() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/profile/trends'), { headers: authHeader() });
        const json = await response.json().catch(() => null);
        if (response.ok) setData(json as TrendsResponse);
      } catch {
        // Trends are a nice-to-have widget — a failed fetch just hides it.
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeader]);

  if (loading || !data) {
    return null;
  }

  const visibleFields = Object.entries(data.trends).filter(([, window]) => window['7d'].data_points > 0);

  if (visibleFields.length === 0) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Trends (7 Tage)</h3>
        <p className="mt-2 text-sm text-[#B7BDC4]">
          Noch keine Trends verfügbar. Fülle ein paar Tage lang deinen Check-in aus, um hier Verläufe zu sehen.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Trends (7 Tage)</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleFields.map(([field, window]) => (
          <div key={field} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
            <p className="text-xs text-[#8E969F]">{FIELD_LABELS[field] ?? field}</p>
            <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{window['7d'].average}</p>
            {window['7d'].data_quality === 'partial' && (
              <p className="mt-1 text-[10px] text-[#6B7480]">wenig Daten ({window['7d'].data_points}x)</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#8E969F]">{data.disclaimer}</p>
    </article>
  );
}
