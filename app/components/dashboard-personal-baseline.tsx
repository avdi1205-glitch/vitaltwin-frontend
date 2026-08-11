'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type BaselineItem = {
  field: string;
  available: boolean;
  message: string;
  recent_data_points?: number;
  baseline_data_points?: number;
  recent_data_quality?: string;
  baseline_data_quality?: string;
  last_updated?: string | null;
  period_days?: number;
};

type BaselineResponse = {
  items: BaselineItem[];
  not_yet_tracked: BaselineItem[];
  disclaimer: string;
};

/**
 * Personal Baseline Engine display (VitalTwin Mehrwert Phase 1). Compares
 * the last 7 days against the user's own 28-day baseline — never against a
 * generic average — for the fields VitalTwin actually tracks today (sleep
 * duration, steps, movement minutes). All numbers come straight from
 * `app/services/personal_baseline.py`; nothing is computed or invented here.
 *
 * "Ausführlichere Wellness-Auswertungen" (Premium/Pro/Family) — the
 * backend enforces this server-side (`has_feature(email,
 * "detailed_wellness")`); a 403 here shows the same upgrade card pattern
 * used elsewhere (e.g. `dashboard/blutzucker/page.tsx`), never a silent
 * failure or fake data.
 */
export default function DashboardPersonalBaseline() {
  const [data, setData] = useState<BaselineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [denied, setDenied] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/profile/baseline'), { headers: authHeader() });
        const json = await response.json().catch(() => null);
        if (response.ok) {
          setData(json as BaselineResponse);
        } else if (response.status === 403) {
          setDenied(true);
        } else {
          setErrorMessage('Persönlicher Verlauf konnte nicht geladen werden.');
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
      <article id="persoenlicher-verlauf" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">Lade deinen persönlichen Verlauf...</p>
      </article>
    );
  }

  if (denied) {
    return (
      <article id="persoenlicher-verlauf" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">
          Premium-Feature
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#B7BDC4]">
          Ausführlichere Wellness-Auswertungen (dein persönlicher Verlauf gegen deine eigene Baseline) sind Teil von
          Premium.
        </p>
        <Link
          href="/preise"
          className="mt-5 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          Premium ansehen
        </Link>
      </article>
    );
  }

  if (errorMessage) {
    return (
      <article id="persoenlicher-verlauf" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          Dein persönlicher Verlauf
        </h3>
        <p className="mt-2 text-sm text-red-300">{errorMessage}</p>
      </article>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <article id="persoenlicher-verlauf" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
        Dein persönlicher Verlauf
      </h3>
      <p className="mt-1 text-xs text-[#8E969F]">
        Vergleich der letzten 7 Tage mit deiner eigenen 28-Tage-Baseline — nicht mit anderen Nutzern.
      </p>
      <div className="mt-4 space-y-3">
        {data.items.map((item) => (
          <div key={item.field} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-sm text-[#F5F2EA]">{item.message}</p>
            {item.available && item.recent_data_quality === 'partial' && (
              <p className="mt-1 text-[10px] text-[#6B7480]">
                Vorläufig, wenig Daten ({item.recent_data_points}x diese Woche)
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#8E969F]">{data.disclaimer}</p>
    </article>
  );
}
