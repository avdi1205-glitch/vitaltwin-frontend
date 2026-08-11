'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type GoogleHealthStatus = {
  connected: boolean;
  status?: string;
};

type DashboardTwinSummaryProps = {
  hasCheckinToday: boolean;
  hasBiomarkerTwin: boolean;
  isPremium: boolean;
};

/**
 * Compact "Dein persönlicher Twin" first-impression card (Beta WOW Release,
 * item 5/6): shows only real, already-known or lightly-fetched state — no
 * fabricated score. Biological age remains available further down as its own
 * domain card; this card represents the wider Unified Twin at a glance.
 */
export default function DashboardTwinSummary({ hasCheckinToday, hasBiomarkerTwin, isPremium }: DashboardTwinSummaryProps) {
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGoogleStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGoogleStatus]);

  const activeDomains = [hasCheckinToday, hasBiomarkerTwin, Boolean(googleConnected)].filter(Boolean).length;

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
    </section>
  );
}
