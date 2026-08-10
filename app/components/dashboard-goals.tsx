'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type Goal = {
  id: string;
  title: string;
  goal_type: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  target_value: number | null;
  target_date: string | null;
};

const GOAL_TYPES: { id: string; label: string }[] = [
  { id: 'besser_schlafen', label: 'Besser schlafen' },
  { id: 'mehr_bewegen', label: 'Mehr bewegen' },
  { id: 'stress_reduzieren', label: 'Stress reduzieren' },
  { id: 'gesuender_essen', label: 'Gesünder essen' },
  { id: 'mehr_energie', label: 'Mehr Energie' },
  { id: 'bessere_erholung', label: 'Besser erholen' },
  { id: 'gesunde_gewohnheiten_aufbauen', label: 'Gewohnheiten aufbauen' },
  { id: 'eigenes_ziel', label: 'Eigenes Ziel' },
];

/**
 * Goal Loop (Twin Intelligence Core, Etappe 3 §6). Real backend persistence
 * via `/api/profile/goals`. Kept compact: creation + status changes only —
 * detailed goal actions/plans are a later etappe (Daily Planning Loop).
 */
export default function DashboardGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState(GOAL_TYPES[0].id);
  const [saving, setSaving] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/profile/goals'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        setGoals(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      setErrorMessage('Ziele konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGoals();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGoals]);

  const addGoal = async () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('/api/profile/goals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ title: trimmed, goal_type: goalType }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? 'Ziel konnte nicht gespeichert werden.');
        return;
      }
      setTitle('');
      setShowAddForm(false);
      await loadGoals();
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (goalId: string, status: Goal['status']) => {
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl(`/api/profile/goals/${goalId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ status }),
      });
      // A tier limit (e.g. Free/Premium's single-active-goal cap) responds
      // with a real 403 + explanatory `detail` — must be surfaced, not
      // silently swallowed (fetch only throws on network failure, not 4xx).
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.detail ?? 'Status konnte nicht geändert werden.');
        return;
      }
      await loadGoals();
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    }
  };

  const removeGoal = async (goalId: string) => {
    try {
      await fetch(apiUrl(`/api/profile/goals/${goalId}`), { method: 'DELETE', headers: authHeader() });
      await loadGoals();
    } catch {
      setErrorMessage('Ziel konnte nicht archiviert werden.');
    }
  };

  const visibleGoals = goals.filter((goal) => goal.status !== 'archived');

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Ziele</h3>
        <button
          onClick={() => setShowAddForm((current) => !current)}
          className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          Ziel hinzufügen
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. 3x pro Woche laufen"
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          >
            {GOAL_TYPES.map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <button
            onClick={() => void addGoal()}
            disabled={saving}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      )}

      {errorMessage && <p className="mt-3 text-xs text-red-300">{errorMessage}</p>}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-[#8E969F]">Lade Ziele...</p>
        ) : visibleGoals.length === 0 ? (
          <p className="text-sm text-[#B7BDC4]">Noch keine Ziele angelegt.</p>
        ) : (
          visibleGoals.map((goal) => (
            <div
              key={goal.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#F5F2EA]">{goal.title}</p>
                <p className="text-xs text-[#8E969F]">
                  {GOAL_TYPES.find((type) => type.id === goal.goal_type)?.label ?? goal.goal_type} · Status:{' '}
                  {goal.status === 'active' ? 'Aktiv' : goal.status === 'paused' ? 'Pausiert' : 'Abgeschlossen'}
                </p>
              </div>
              <div className="flex gap-2">
                {goal.status !== 'completed' && (
                  <button
                    onClick={() => void setStatus(goal.id, goal.status === 'active' ? 'paused' : 'active')}
                    className="rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-[#F5F2EA]"
                  >
                    {goal.status === 'active' ? 'Pausieren' : 'Aktivieren'}
                  </button>
                )}
                {goal.status !== 'completed' && (
                  <button
                    onClick={() => void setStatus(goal.id, 'completed')}
                    className="rounded-lg border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4]"
                  >
                    Abschließen
                  </button>
                )}
                <button
                  onClick={() => void removeGoal(goal.id)}
                  className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-300"
                >
                  Archivieren
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
