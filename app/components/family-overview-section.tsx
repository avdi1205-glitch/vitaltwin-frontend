'use client';

import type { FamilyState } from './family-section';
import type { FamilyGoal } from './family-goals-section';

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', member: 'Mitglied' };
const STATUS_LABEL: Record<string, string> = {
  active: 'Aktiv',
  invited: 'Eingeladen',
  removed: 'Entfernt',
  left: 'Ausgetreten',
};

type FamilyOverviewSectionProps = {
  state: FamilyState;
  currentUserEmail: string | null;
  goals: FamilyGoal[] | null;
  goalsLoading: boolean;
  goalsError: string;
  onInviteMember: () => void;
  onCreateGoal: () => void;
  onViewGoals: () => void;
  onLeaveFamily: () => void;
};

/**
 * Family Overview V1 (Beta): a Family-safe SUMMARY built purely by
 * composing data already returned by GET /api/family/me and
 * GET /api/family/goals — no new backend endpoint, no new fetch, no
 * private wellness data. Only ever renders: display name/email, role,
 * membership status, Family Goal titles/participation/progress. Never
 * daily wellness entries, CGM, nutrition, Google Health, personal
 * goals/habits, Twin chat, simulations, reports, or baseline data.
 */
export default function FamilyOverviewSection({
  state,
  currentUserEmail,
  goals,
  goalsLoading,
  goalsError,
  onInviteMember,
  onCreateGoal,
  onViewGoals,
  onLeaveFamily,
}: FamilyOverviewSectionProps) {
  const activeGoals = goals ?? [];
  const pendingInvites = state.members.filter((m) => m.status === 'invited').length;
  const participatingUserIds = new Set<number>();
  activeGoals.forEach((goal) => goal.participants.forEach((p) => participatingUserIds.add(p.user_id)));

  return (
    <div className="rounded-2xl border border-[#58D7D4]/20 bg-white/[0.02] p-5">
      <h3 className="font-[family-name:var(--font-serif-display)] text-base font-semibold text-[#F5F2EA]">
        Family-Übersicht
      </h3>

      {/* 1. Family header */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#F5F2EA]">
        <span>
          Deine Rolle: <strong>{ROLE_LABEL[state.role ?? ''] ?? state.role}</strong>
        </span>
        <span>
          Status: <strong>{STATUS_LABEL[state.status ?? ''] ?? state.status}</strong>
        </span>
        <span>
          Mitglieder: <strong>{state.member_count_active} / {state.max_members}</strong>
        </span>
      </div>

      {/* 2. Members (compact, Family-safe only) */}
      <div className="mt-3 flex flex-wrap gap-2">
        {state.members.map((member) => (
          <span
            key={member.user_id}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#B7BDC4]"
          >
            {member.display_name || member.email} · {ROLE_LABEL[member.role]} · {STATUS_LABEL[member.status]}
          </span>
        ))}
      </div>

      {/* 3. Active Family Goals */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8E969F]">Aktive Familienziele</p>
        {goalsLoading && <p className="mt-2 text-sm text-[#8E969F]">Lädt Familienziele...</p>}
        {!goalsLoading && goalsError && <p className="mt-2 text-sm text-red-300">{goalsError}</p>}
        {!goalsLoading && !goalsError && activeGoals.length === 0 && (
          <p className="mt-2 text-sm text-[#8E969F]">Noch keine aktiven Familienziele.</p>
        )}
        {!goalsLoading && !goalsError && activeGoals.length > 0 && (
          <div className="mt-2 space-y-2">
            {activeGoals.map((goal) => {
              const own = currentUserEmail ? goal.participants.find((p) => p.email === currentUserEmail) : undefined;
              return (
                <div key={goal.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                  <p className="font-semibold text-[#F5F2EA]">{goal.title}</p>
                  <p className="mt-1 text-xs text-[#8E969F]">
                    {goal.participant_count} Teilnehmende · {goal.completed_count} erledigt
                    {own && ` · Dein Fortschritt: ${own.progress_value ?? 0}${own.completed ? ' (erledigt)' : ''}`}
                    {!own && currentUserEmail && ' · Du nimmst noch nicht teil'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Family activity summary (strictly Family-safe sentences) */}
      {!goalsLoading && !goalsError && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#B7BDC4]">
          <li>{activeGoals.length} aktive Familienziele</li>
          {state.member_count_active > 0 && (
            <li>
              {participatingUserIds.size} von {state.member_count_active} Mitgliedern nehmen an mind. einem
              Familienziel teil
            </li>
          )}
          {pendingInvites > 0 && <li>{pendingInvites} Einladung(en) ausstehend</li>}
        </ul>
      )}

      {/* 5. Quick actions — reuse existing functionality only */}
      <div className="mt-4 flex flex-wrap gap-2">
        {state.role === 'owner' && state.status === 'active' && (
          <>
            <button
              onClick={onInviteMember}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Mitglied einladen
            </button>
            <button
              onClick={onCreateGoal}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Familienziel erstellen
            </button>
          </>
        )}
        {state.role === 'member' && (
          <>
            <button
              onClick={onViewGoals}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Familienziele ansehen
            </button>
            {state.status === 'active' && (
              <button
                onClick={onLeaveFamily}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
              >
                Family verlassen
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
