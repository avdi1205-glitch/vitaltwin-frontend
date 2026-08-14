'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

export type ChallengeParticipant = {
  user_id: number;
  email: string;
  display_name: string | null;
  progress_value: number | null;
  completed: boolean | null;
};

export type FamilyChallenge = {
  id: number;
  title: string;
  description: string | null;
  target_type: 'completion_count' | 'days_completed';
  target_value: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'archived';
  created_by: { email: string; display_name: string | null };
  participants: ChallengeParticipant[];
  participant_count: number;
  completed_count: number;
};

type FamilyChallengesSectionProps = {
  role: 'owner' | 'member' | null;
  challenges: FamilyChallenge[] | null;
  loading: boolean;
  errorMessage: string;
  onChanged: () => void;
  /** Incrementing signal from the Family Overview's "Challenge erstellen" quick action — opens the create form when it changes. */
  openCreateFormSignal?: number;
};

/**
 * Familien-Challenges (Beta, Family tier): zeitlich begrenzte gemeinsame
 * Motivations-Aktivitäten (z. B. "7 Tage gemeinsam spazieren") — NIE
 * private Wellness-Daten. Zeigt nur explizit für diese Challenge
 * eingetragenen Fortschritt, niemals Check-ins, CGM, Google Health,
 * Twin-Chat, persönliche Ziele/Gewohnheiten. Backend:
 * /api/family/challenges*. Bewusst getrennt von Familienzielen (eigene
 * Tabelle) trotz ähnlicher Form, siehe family.py-Moduldoku. Challenges
 * werden EINMAL vom übergeordneten FamilySection geladen (geteilt mit
 * FamilyOverviewSection) — diese Komponente mutiert nur.
 */
export default function FamilyChallengesSection({
  role,
  challenges,
  loading,
  errorMessage,
  onChanged,
  openCreateFormSignal,
}: FamilyChallengesSectionProps) {
  const t = useTranslations('familyChallenges');
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

  const createChallenge = async () => {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl('/api/family/challenges'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? t('createError'));
        return;
      }
      setTitle('');
      setShowCreateForm(false);
      onChanged();
    } catch {
      setActionError(t('backendError'));
    } finally {
      setBusy(false);
    }
  };

  const joinChallenge = async (challengeId: number) => {
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl(`/api/family/challenges/${challengeId}/join`), {
        method: 'POST',
        headers: authHeader(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? t('joinError'));
        return;
      }
      onChanged();
    } catch {
      setActionError(t('backendError'));
    } finally {
      setBusy(false);
    }
  };

  const updateProgress = async (challengeId: number, completed?: boolean) => {
    setBusy(true);
    setActionError('');
    try {
      const draft = progressDrafts[challengeId];
      const body: { progress_value?: number; completed?: boolean } = {};
      if (draft !== undefined && draft !== '') body.progress_value = Number(draft);
      if (completed !== undefined) body.completed = completed;
      const response = await fetch(apiUrl(`/api/family/challenges/${challengeId}/progress`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? t('progressError'));
        return;
      }
      onChanged();
    } catch {
      setActionError(t('backendError'));
    } finally {
      setBusy(false);
    }
  };

  const archiveChallenge = async (challengeId: number) => {
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch(apiUrl(`/api/family/challenges/${challengeId}`), {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.detail ?? t('archiveError'));
        return;
      }
      onChanged();
    } catch {
      setActionError(t('backendError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="family-challenges-section" className="mt-6 border-t border-white/10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">
          {t('title')}
        </h3>
        {role === 'owner' && (
          <button
            id="family-challenges-create-button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            {t('add')}
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        {t('description')}
      </p>

      {showCreateForm && role === 'owner' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
          <button
            onClick={() => void createChallenge()}
            disabled={busy || !title.trim()}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('save')}
          </button>
        </div>
      )}

      {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
      {actionError && <p className="mt-4 text-sm text-red-300">{actionError}</p>}

      {loading && <p className="mt-4 text-[#8E969F]">{t('loading')}</p>}

      {!loading && challenges && challenges.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
          {t('empty')}
        </p>
      )}

      {!loading && challenges && challenges.length > 0 && (
        <div className="mt-4 space-y-3">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#F5F2EA]">{challenge.title}</p>
                {role === 'owner' && (
                  <button
                    onClick={() => void archiveChallenge(challenge.id)}
                    disabled={busy}
                    className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('archive')}
                  </button>
                )}
              </div>
              {challenge.description && <p className="mt-1 text-xs text-[#8E969F]">{challenge.description}</p>}
              <p className="mt-2 text-xs text-[#8E969F]">
                {challenge.participant_count} {t('participantsCount')} · {challenge.completed_count} {t('completedCount')}
                {challenge.end_date && ` · ${t('untilLabel')} ${challenge.end_date}`}
              </p>

              <div className="mt-2 space-y-1">
                {challenge.participants.map((participant) => (
                  <p key={participant.user_id} className="text-xs text-[#B7BDC4]">
                    {participant.display_name || participant.email}: {participant.progress_value ?? 0}
                    {participant.completed ? ` · ${t('completedSuffix')}` : ''}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void joinChallenge(challenge.id)}
                  disabled={busy}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('join')}
                </button>
                <input
                  type="number"
                  value={progressDrafts[challenge.id] ?? ''}
                  onChange={(e) => setProgressDrafts((current) => ({ ...current, [challenge.id]: e.target.value }))}
                  onFocus={(elEvent) => elEvent.target.select()}
                  placeholder={t('progressPlaceholder')}
                  className="w-24 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
                <button
                  onClick={() => void updateProgress(challenge.id)}
                  disabled={busy}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('saveProgress')}
                </button>
                <button
                  onClick={() => void updateProgress(challenge.id, true)}
                  disabled={busy}
                  className="rounded-lg border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('markCompleted')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
