'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type GoogleHealthStatus = {
  connected: boolean;
  status?: string;
};

type TwinEvolutionSummary = {
  active_domain_count: number;
  data_quality_summary: Record<string, number>;
  comparison: {
    available: boolean;
    reason: string | null;
    explanations: string[];
  };
};

type DashboardTwinSummaryProps = {
  hasCheckinToday: boolean;
  hasBiomarkerTwin: boolean;
  isPremium: boolean;
};

// Matches the fixed 7-domain Unified Twin State model (backend
// unified_twin_state.py: behavioral, automatic_health, metabolic, biomarker,
// memory, pattern, goal_habit) — not a guess, the real domain count.
const TOTAL_TWIN_DOMAINS = 7;

/**
 * Compact "Dein persönlicher Twin" first-impression card (Beta WOW Release,
 * item 5/6): shows only real, already-known or lightly-fetched state — no
 * fabricated score. Biological age remains available further down as its own
 * domain card; this card represents the wider Unified Twin at a glance.
 *
 * The insight strip below additionally reuses the existing, free-tier
 * GET /api/profile/twin-evolution endpoint (Twin Core Phase 7) — no new
 * calculation — to surface, right at the top of the dashboard, what already
 * changed, what's still missing, and how many domains the picture is based
 * on (Premium UX Polish round).
 */
export default function DashboardTwinSummary({ hasCheckinToday, hasBiomarkerTwin, isPremium }: DashboardTwinSummaryProps) {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [evolution, setEvolution] = useState<TwinEvolutionSummary | null>(null);

  const loadGoogleStatus = useCallback(async () => {
    if (!isPremium) {
      setGoogleConnected(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/health/google/status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = (await response.json()) as GoogleHealthStatus;
        setGoogleConnected(Boolean(data.connected) && data.status !== 'reauthorization_required');
      }
    } catch {
      // Non-fatal — automatic-data status simply stays unknown, no claim shown.
    }
  }, [isPremium]);

  const loadEvolution = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/profile/twin-evolution'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEvolution((await response.json()) as TwinEvolutionSummary);
      }
    } catch {
      // Non-fatal — the insight strip simply stays in its loading state.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGoogleStatus();
      void loadEvolution();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGoogleStatus, loadEvolution]);

  const activeDomains = [hasCheckinToday, hasBiomarkerTwin, Boolean(googleConnected)].filter(Boolean).length;

  const changeText = !evolution
    ? 'Lädt…'
    : evolution.comparison.available && evolution.comparison.explanations.length > 0
      ? evolution.comparison.explanations[0]
      : (evolution.comparison.reason ?? 'Noch keine Veränderung seit deiner letzten Aufzeichnung erkennbar.');

  const missingCount = evolution?.data_quality_summary?.missing ?? null;
  const missingText =
    missingCount === null
      ? 'Lädt…'
      : missingCount === 0
        ? `Alle ${TOTAL_TWIN_DOMAINS} Twin-Bereiche liefern bereits Daten.`
        : `${missingCount} von ${TOTAL_TWIN_DOMAINS} Twin-Bereichen haben noch keine Daten.`;

  const basisText =
    evolution === null ? 'Lädt…' : `Basiert aktuell auf ${evolution.active_domain_count} von ${TOTAL_TWIN_DOMAINS} Bereichen mit Daten.`;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
        Dein persönlicher Twin
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        <div>
          <p className="text-2xl font-bold text-[#F5F2EA]">{activeDomains} von 3</p>
          <p className="mt-1 text-sm text-[#B7BDC4]">aktive Twin-Bereiche (Check-in, Biomarker, automatische Daten)</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F5F2EA]">
            {googleConnected === null ? 'Automatische Daten: lädt…' : googleConnected ? '✅ Automatische Daten verbunden' : 'Automatische Daten nicht verbunden'}
          </p>
          <Link
            href="/dashboard/gesundheitsdaten"
            className="mt-1 inline-block text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]"
          >
            {googleConnected ? 'Verbindung ansehen' : 'Automatische Daten verbinden'}
          </Link>
        </div>
        <div>
          <p className="text-sm text-[#B7BDC4]">
            Was dein Twin über dich weiß und lernt, siehst du weiter unten auf dieser Seite.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-mono-technical)] text-[11px] uppercase tracking-[0.18em] text-[#8E969F]">
            Was sich verändert hat
          </p>
          <p className="mt-1 text-sm text-[#F5F2EA]">{changeText}</p>
        </div>
        <div>
          <p className="font-[family-name:var(--font-mono-technical)] text-[11px] uppercase tracking-[0.18em] text-[#8E969F]">
            Was deinem Twin noch fehlt
          </p>
          <p className="mt-1 text-sm text-[#F5F2EA]">{missingText}</p>
        </div>
        <div>
          <p className="font-[family-name:var(--font-mono-technical)] text-[11px] uppercase tracking-[0.18em] text-[#8E969F]">
            Wie belastbar diese Einschätzung ist
          </p>
          <p className="mt-1 text-sm text-[#F5F2EA]">{basisText}</p>
        </div>
      </div>
    </section>
  );
}
