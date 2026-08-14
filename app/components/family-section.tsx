'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import FamilyGoalsSection, { type FamilyGoal } from './family-goals-section';
import FamilyChallengesSection, { type FamilyChallenge } from './family-challenges-section';
import FamilyOverviewSection from './family-overview-section';

export type FamilyMember = {
  user_id: number;
  email: string;
  display_name: string | null;
  role: 'owner' | 'member';
  status: 'active' | 'invited' | 'removed' | 'left';
};

export type FamilyState = {
  in_family: boolean;
  eligible_to_create: boolean;
  family_id: number | null;
  role: 'owner' | 'member' | null;
  status: 'active' | 'invited' | null;
  member_count_active: number;
  max_members: number;
  members: FamilyMember[];
  family_entitlement_active: boolean;
};

/**
 * Family Foundation V1 (Beta): reines Mitgliedschafts-Roster (E-Mail,
 * Anzeigename, Rolle, Status) — KEINE gemeinsamen Gesundheitsdaten. Jedes
 * Mitglied bleibt ein vollständig unabhängiges VitalTwin-Konto. Backend:
 * /api/family/*.
 */
export default function FamilySection({ currentUserEmail }: { currentUserEmail?: string | null }) {
  const t = useTranslations('family');
  const [state, setState] = useState<FamilyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const [goals, setGoals] = useState<FamilyGoal[] | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState('');
  const [openCreateGoalSignal, setOpenCreateGoalSignal] = useState(0);

  const [challenges, setChallenges] = useState<FamilyChallenge[] | null>(null);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState('');
  const [openCreateChallengeSignal, setOpenCreateChallengeSignal] = useState(0);

  const inviteInputRef = useRef<HTMLInputElement>(null);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('/api/family/me'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? t('statusLoadError'));
        return;
      }
      setState(data);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [authHeader, t]);

  const loadGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError('');
    try {
      const response = await fetch(apiUrl('/api/family/goals'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setGoalsError(data?.detail ?? t('goalsLoadError'));
        return;
      }
      setGoals(data.goals ?? []);
    } catch {
      setGoalsError(t('backendError'));
    } finally {
      setGoalsLoading(false);
    }
  }, [authHeader, t]);

  const loadChallenges = useCallback(async () => {
    setChallengesLoading(true);
    setChallengesError('');
    try {
      const response = await fetch(apiUrl('/api/family/challenges'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setChallengesError(data?.detail ?? t('challengesLoadError'));
        return;
      }
      setChallenges(data.challenges ?? []);
    } catch {
      setChallengesError(t('backendError'));
    } finally {
      setChallengesLoading(false);
    }
  }, [authHeader, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Family Goals/Challenges are only meaningful once membership is active —
  // each fetched exactly once here and shared by FamilyOverviewSection and
  // their respective detail sections (no duplicate requests).
  useEffect(() => {
    if (state?.in_family && state.status === 'active') {
      const timer = window.setTimeout(() => {
        void loadGoals();
        void loadChallenges();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [state?.in_family, state?.status, loadGoals, loadChallenges]);

  const runAction = async (path: string, method: string, body?: object) => {
    setBusy(true);
    setErrorMessage('');
    setActionMessage('');
    try {
      const response = await fetch(apiUrl(path), {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? t('actionFailed'));
        return;
      }
      if (typeof data?.email_sent === 'boolean') {
        setActionMessage(
          data.email_sent
            ? t('invitationSaved')
            : t('invitationSavedNoEmail'),
        );
      }
      await load();
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setBusy(false);
    }
  };

  const focusInvite = () => {
    inviteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => inviteInputRef.current?.focus(), 300);
  };

  const scrollToGoals = () => {
    document.getElementById('family-goals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToChallenges = () => {
    document.getElementById('family-challenges-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const ROLE_LABEL: Record<string, string> = { owner: t('roleOwner'), member: t('roleMember') };
  const STATUS_LABEL: Record<string, string> = {
    active: t('statusActive'),
    invited: t('statusInvited'),
    removed: t('statusRemoved'),
    left: t('statusLeft'),
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('title')}</h2>
        <span className="rounded-full border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4]">{t('betaBadge')}</span>
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        {t('description', { max: state?.max_members ?? 6 })}
      </p>

      {loading && <p className="mt-4 text-[#8E969F]">{t('loading')}</p>}

      {!loading && errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
      {!loading && actionMessage && <p className="mt-4 text-sm text-[#58D7D4]">{actionMessage}</p>}

      {!loading && state && !state.in_family && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          {state.eligible_to_create ? (
            <>
              <p className="text-sm text-[#F5F2EA]">{t('notInFamily')}</p>
              <button
                onClick={() => void runAction('/api/family', 'POST')}
                disabled={busy}
                className="mt-3 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? t('creating') : t('createFamily')}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#F5F2EA]">{t('familyPlanFeature')}</p>
              <a
                href="/preise"
                className="mt-3 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('viewFamily')}
              </a>
            </>
          )}
        </div>
      )}

      {!loading && state && state.in_family && (
        <div className="mt-4 space-y-4">
          <FamilyOverviewSection
            state={state}
            currentUserEmail={currentUserEmail ?? null}
            goals={goals}
            goalsLoading={goalsLoading}
            goalsError={goalsError}
            challenges={challenges}
            challengesLoading={challengesLoading}
            challengesError={challengesError}
            onInviteMember={focusInvite}
            onCreateGoal={() => setOpenCreateGoalSignal((n) => n + 1)}
            onViewGoals={scrollToGoals}
            onCreateChallenge={() => setOpenCreateChallengeSignal((n) => n + 1)}
            onViewChallenges={scrollToChallenges}
            onLeaveFamily={() => void runAction('/api/family/leave', 'POST')}
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
            {t('yourRole')} {ROLE_LABEL[state.role ?? ''] ?? state.role} · {t('statusLabel')} {STATUS_LABEL[state.status ?? ''] ?? state.status} ·{' '}
            {t('membersLabel')} {state.member_count_active} / {state.max_members}
          </div>

          {!state.family_entitlement_active && (
            <div className="rounded-xl border border-[#F3C979]/30 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
              {t('entitlementInactiveNotice')}
            </div>
          )}

          <div className="space-y-2">
            {state.members.map((member) => (
              <div
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#F5F2EA]">{member.display_name || member.email}</p>
                  <p className="text-xs text-[#8E969F]">
                    {member.email} · {ROLE_LABEL[member.role]} · {STATUS_LABEL[member.status]}
                  </p>
                </div>
                {state.role === 'owner' && member.role !== 'owner' && state.family_entitlement_active && (
                  <button
                    onClick={() => void runAction(`/api/family/members/${member.user_id}`, 'DELETE')}
                    disabled={busy}
                    className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('remove')}
                  </button>
                )}
              </div>
            ))}
          </div>

          {state.role === 'owner' && state.status === 'active' && state.family_entitlement_active && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inviteInputRef}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('invitePlaceholder')}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
              />
              <button
                onClick={() => {
                  const email = inviteEmail.trim();
                  if (!email) return;
                  void runAction('/api/family/invite', 'POST', { email });
                  setInviteEmail('');
                }}
                disabled={busy || !inviteEmail.trim()}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('invite')}
              </button>
            </div>
          )}

          {state.status === 'invited' && (
            <button
              onClick={() => void runAction('/api/family/accept', 'POST')}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t('acceptInvite')}
            </button>
          )}

          <button
            id="family-leave-button"
            onClick={() => void runAction('/api/family/leave', 'POST')}
            disabled={busy}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('leaveFamily')}
          </button>

          {state.status === 'active' && (
            <FamilyGoalsSection
              role={state.role}
              goals={goals}
              loading={goalsLoading}
              errorMessage={goalsError}
              onChanged={() => void loadGoals()}
              openCreateFormSignal={openCreateGoalSignal}
            />
          )}

          {state.status === 'active' && (
            <FamilyChallengesSection
              role={state.role}
              challenges={challenges}
              loading={challengesLoading}
              errorMessage={challengesError}
              onChanged={() => void loadChallenges()}
              openCreateFormSignal={openCreateChallengeSignal}
            />
          )}
        </div>
      )}
    </section>
  );
}

