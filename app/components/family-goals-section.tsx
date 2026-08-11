'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/api';

export type GoalParticipant = {
  user_id: number;
  email: string;
  display_name: string | null;
  progress_value: number | null;
  completed: boolean | null;
};

export type FamilyGoal = {
  id: number;
  title: string;
  description: string | null;
  target_type: 'count' | 'days' | 'custom';
  target_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'archived';
  created_by: { email: string; display_name: string | null };
  participants: GoalParticipant[];
  participant_count: number;
  completed_count: number;
};

type FamilyGoalsSectionProps = {
  role: 'owner' | 'member' | null;
  goals: FamilyGoal[] | null;
  loading: boolean;
  errorMessage: string;
  onChanged: () => void;
  /** Incrementing signal from the Family Overview's "Familienziel erstellen" quick action — opens the create form when it changes. */
  openCreateFormSignal?: number;
};

/**
 * Familienziele (Beta, Family tier): gemeinsame Koordinations-Ziele — NIE
 * private Wellness-Daten. Zeigt nur explizit für dieses Ziel eingetragenen
 * Fortschritt (Teilnahme/Zahl/erledigt), niemals Check-ins, CGM, Google
 * Health, Twin-Chat, persönliche Ziele/Gewohnheiten. Backend:
 * /api/family/goals*. Goals are fetched ONCE by the parent FamilySection
 * (shared with FamilyOverviewSection) — this component only mutates.
 */
export default function FamilyGoalsSection({
  role,
  goals,
  loading,
  errorMessage,
  onChanged,
  openCreateFormSignal,
}: FamilyGoalsSectionProps) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [progressDrafts, setProgressDrafts] = useState<Record<number, string>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastSignalRef = useRef(openCreateFormSignal);

  useEffect(() => {
    if (openCreateFormSignal !== undefined && openCreateFormSignal !== lastSignalRef.current) {
      lastSignalRef.current = openCreateFormSignal;
      setShowCreateForm(true);
      window.setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [openCreateFormSignal]);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const createGoal = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl('/api/family/goals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? 'Familienziel konnte nicht gespeichert werden.');
        return;
      }
      setTitle('');
      setShowCreateForm(false);
      onChanged();
    } catch {
      setActionError('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  const joinGoal = async (goalId: number) => {
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl(`/api/family/goals/${goalId}/join`), {
        method: 'POST',
        headers: authHeader(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? 'Teilnahme fehlgeschlagen.');
        return;
      }
      onChanged();
    } catch {
      setActionError('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  const updateProgress = async (goalId: number, completed?: boolean) => {
    setBusy(true);
    setActionError('');
    try {
      const draft = progressDrafts[goalId];
      const body: { progress_value?: number; completed?: boolean } = {};
      if (draft !== undefined && draft !== '') body.progress_value = Number(draft);
      if (completed !== undefined) body.completed = completed;
      const response = await fetch(apiUrl(`/api/family/goals/${goalId}/progress`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? 'Fortschritt konnte nicht gespeichert werden.');
        return;
      }
      onChanged();
    } catch {
      setActionError('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  const archiveGoal = async (goalId: number) => {
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl(`/api/family/goals/${goalId}`), { method: 'DELETE', headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? 'Familienziel konnte nicht archiviert werden.');
        return;
      }
      onChanged();
    } catch {
      setActionError('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="family-goals-section" className="mt-6 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">Familienziele</h3>
        {role === 'owner' && (
          <button
            id="family-goals-create-button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            Familienziel hinzufügen
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        Gemeinsame Koordinations-Ziele — z. B. „3 Spaziergänge diese Woche&rdquo;. Zeigt nur explizit eingetragenen
        Fortschritt, niemals private Wellness-Daten.
      </p>

      {showCreateForm && role === 'owner' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. 3 Spaziergänge diese Woche"
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
          <button
            onClick={() => void createGoal()}
            disabled={busy || !title.trim()}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Speichern
          </button>
        </div>
      )}

      {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
      {actionError && <p className="mt-4 text-sm text-red-300">{actionError}</p>}

      {loading && <p className="mt-4 text-[#8E969F]">Lädt...</p>}

      {!loading && goals && goals.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
          Noch keine Familienziele vorhanden.
        </p>
      )}

      {!loading && goals && goals.length > 0 && (
        <div className="mt-4 space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#F5F2EA]">{goal.title}</p>
                {role === 'owner' && (
                  <button
                    onClick={() => void archiveGoal(goal.id)}
                    disabled={busy}
                    className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Archivieren
                  </button>
                )}
              </div>
              {goal.description && <p className="mt-1 text-xs text-[#8E969F]">{goal.description}</p>}
              <p className="mt-2 text-xs text-[#8E969F]">
                {goal.participant_count} Teilnehmende · {goal.completed_count} erledigt
              </p>

              <div className="mt-2 space-y-1">
                {goal.participants.map((participant) => (
                  <p key={participant.user_id} className="text-xs text-[#B7BDC4]">
                    {participant.display_name || participant.email}: {participant.progress_value ?? 0}
                    {participant.completed ? ' · erledigt' : ''}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void joinGoal(goal.id)}
                  disabled={busy}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mitmachen
                </button>
                <input
                  type="number"
                  value={progressDrafts[goal.id] ?? ''}
                  onChange={(e) => setProgressDrafts((current) => ({ ...current, [goal.id]: e.target.value }))}
                  onFocus={(elEvent) => elEvent.target.select()}
                  placeholder="Fortschritt"
                  className="w-24 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
                <button
                  onClick={() => void updateProgress(goal.id)}
                  disabled={busy}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Fortschritt speichern
                </button>
                <button
                  onClick={() => void updateProgress(goal.id, true)}
                  disabled={busy}
                  className="rounded-lg border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Als erledigt markieren
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
