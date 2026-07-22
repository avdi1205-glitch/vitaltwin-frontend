'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type WeeklyReflection = {
  data_sufficient: boolean;
  summary: string;
  positive_developments: string[];
  stable_routines: string[];
  potential_areas: string[];
  goal_progress: string[];
  most_helpful_recommendations: string[];
  least_helpful_recommendations: string[];
  suggestions_next_week: string[];
  patterns: string[];
};

type MonthlyProgress = {
  available: boolean;
  reason: string | null;
  goal_development: string[];
  habit_summary: string[];
  changed_preferences: string[];
  confirmed_patterns: string[];
  next_month_goal_suggestions: string[];
};

type Maturity = {
  level: string;
  level_label: string;
  missing_data: string[];
};

const MATURITY_STEPS = ['start', 'lernt_dich_kennen', 'erkennt_routinen', 'versteht_praeferenzen', 'begleitet_langfristig'];

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-[#B7BDC4]">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Weekly Reflection Loop, Monthly Progress (Grundlage) und Twin-Reifegrad
 * (Twin Intelligence Core, Etappe 6). Absichtlich als eine ruhige,
 * einklappbare Karte gebaut ("keine Überladung") — Wochenrückblick ist immer
 * sichtbar, Monatsübersicht und Reifegrad sind optionale Unterabschnitte.
 */
export default function DashboardTwinProgress() {
  const [weekly, setWeekly] = useState<WeeklyReflection | null>(null);
  const [monthly, setMonthly] = useState<MonthlyProgress | null>(null);
  const [maturity, setMaturity] = useState<Maturity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMonthly, setShowMonthly] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    try {
      const [weeklyRes, monthlyRes, maturityRes] = await Promise.all([
        fetch(apiUrl('/api/planning/weekly'), { headers: authHeader() }),
        fetch(apiUrl('/api/planning/monthly'), { headers: authHeader() }),
        fetch(apiUrl('/api/planning/maturity'), { headers: authHeader() }),
      ]);
      const weeklyData = await weeklyRes.json().catch(() => null);
      const monthlyData = await monthlyRes.json().catch(() => null);
      const maturityData = await maturityRes.json().catch(() => null);
      if (weeklyRes.ok) setWeekly(weeklyData);
      if (monthlyRes.ok) setMonthly(monthlyData);
      if (maturityRes.ok) setMaturity(maturityData);
    } catch {
      // Backend gerade nicht erreichbar — Karte bleibt leer, kein Fehler-Overlay.
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">Lade deinen Rückblick...</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Dein Wochenrückblick</h3>

      {weekly && !weekly.data_sufficient && <p className="mt-3 text-sm text-[#B7BDC4]">{weekly.summary}</p>}

      {weekly && weekly.data_sufficient && (
        <div className="mt-3 space-y-3 text-sm text-[#B7BDC4]">
          {weekly.positive_developments.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Positive Entwicklungen</p>
              <Bullets items={weekly.positive_developments} />
            </div>
          )}
          {weekly.stable_routines.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Stabile Routinen</p>
              <Bullets items={weekly.stable_routines} />
            </div>
          )}
          {weekly.potential_areas.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Bereiche mit Potenzial</p>
              <Bullets items={weekly.potential_areas} />
            </div>
          )}
          {weekly.goal_progress.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Fortschritt bei Zielen</p>
              <Bullets items={weekly.goal_progress} />
            </div>
          )}
          {weekly.most_helpful_recommendations.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Hilfreichste Empfehlungen</p>
              <Bullets items={weekly.most_helpful_recommendations} />
            </div>
          )}
          {weekly.suggestions_next_week.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Für nächste Woche</p>
              <Bullets items={weekly.suggestions_next_week} />
            </div>
          )}
          {weekly.patterns.length > 0 && (
            <div>
              <p className="font-semibold text-[#F5F2EA]">Mögliche Muster</p>
              <Bullets items={weekly.patterns} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          onClick={() => setShowMonthly(!showMonthly)}
          className="text-sm font-semibold text-[#8E969F] underline hover:text-[#58D7D4]"
        >
          {showMonthly ? 'Monatsübersicht ausblenden' : 'Monatsübersicht anzeigen'}
        </button>

        {showMonthly && monthly && (
          <div className="mt-3 text-sm text-[#B7BDC4]">
            {!monthly.available ? (
              <p>{monthly.reason}</p>
            ) : (
              <div className="space-y-3">
                {monthly.goal_development.length > 0 && (
                  <div>
                    <p className="font-semibold text-[#F5F2EA]">Zielentwicklung</p>
                    <Bullets items={monthly.goal_development} />
                  </div>
                )}
                {monthly.habit_summary.length > 0 && (
                  <div>
                    <p className="font-semibold text-[#F5F2EA]">Gewohnheiten</p>
                    <Bullets items={monthly.habit_summary} />
                  </div>
                )}
                {monthly.changed_preferences.length > 0 && (
                  <div>
                    <p className="font-semibold text-[#F5F2EA]">Erkannte Präferenzen</p>
                    <Bullets items={monthly.changed_preferences} />
                  </div>
                )}
                {monthly.next_month_goal_suggestions.length > 0 && (
                  <div>
                    <p className="font-semibold text-[#F5F2EA]">Vorschläge für nächsten Monat</p>
                    <Bullets items={monthly.next_month_goal_suggestions} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {maturity && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-[#F5F2EA]">Twin-Reifegrad: {maturity.level_label}</p>
          <div className="mt-2 flex gap-1">
            {MATURITY_STEPS.map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  MATURITY_STEPS.indexOf(maturity.level) >= MATURITY_STEPS.indexOf(step)
                    ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          {maturity.missing_data.length > 0 && (
            <p className="mt-2 text-xs text-[#6B7480]">Für die nächste Stufe: {maturity.missing_data.join(' ')}</p>
          )}
        </div>
      )}
    </article>
  );
}
