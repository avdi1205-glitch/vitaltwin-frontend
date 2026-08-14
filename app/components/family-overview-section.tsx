'use client';

import { useTranslations } from 'next-intl';
import type { FamilyState } from './family-section';
import type { FamilyGoal } from './family-goals-section';
import type { FamilyChallenge } from './family-challenges-section';

const ROLE_LABEL_KEY: Record<string, 'roleOwner' | 'roleMember'> = { owner: 'roleOwner', member: 'roleMember' };
const STATUS_LABEL_KEY: Record<string, 'statusActive' | 'statusInvited' | 'statusRemoved' | 'statusLeft'> = {
  active: 'statusActive',
  invited: 'statusInvited',
  removed: 'statusRemoved',
  left: 'statusLeft',
};

type FamilyOverviewSectionProps = {
  state: FamilyState;
  currentUserEmail: string | null;
  goals: FamilyGoal[] | null;
  goalsLoading: boolean;
  goalsError: string;
  challenges: FamilyChallenge[] | null;
  challengesLoading: boolean;
  challengesError: string;
  onInviteMember: () => void;
  onCreateGoal: () => void;
  onViewGoals: () => void;
  onCreateChallenge: () => void;
  onViewChallenges: () => void;
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
  challenges,
  challengesLoading,
  challengesError,
  onInviteMember,
  onCreateGoal,
  onViewGoals,
  onCreateChallenge,
  onViewChallenges,
  onLeaveFamily,
}: FamilyOverviewSectionProps) {
  const t = useTranslations('family');
  const activeGoals = goals ?? [];
  const activeChallenges = challenges ?? [];
  const pendingInvites = state.members.filter((m) => m.status === 'invited').length;
  const participatingUserIds = new Set<number>();
  activeGoals.forEach((goal) => goal.participants.forEach((p) => participatingUserIds.add(p.user_id)));
  const challengeParticipantIds = new Set<number>();
  activeChallenges.forEach((c) => c.participants.forEach((p) => challengeParticipantIds.add(p.user_id)));

  return (
    <div className="rounded-2xl border border-[#58D7D4]/20 bg-white/[0.02] p-5">
      <h3 className="font-[family-name:var(--font-serif-display)] text-base font-semibold text-[#F5F2EA]">
        {t('overviewTitle')}
      </h3>

      {/* 1. Family header */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#F5F2EA]">
        <span>
          {t('yourRole')} <strong>{t(ROLE_LABEL_KEY[state.role ?? ''] ?? 'roleOwner')}</strong>
        </span>
        <span>
          {t('statusLabel')} <strong>{t(STATUS_LABEL_KEY[state.status ?? ''] ?? 'statusActive')}</strong>
        </span>
        <span>
          {t('membersLabel')} <strong>{state.member_count_active} / {state.max_members}</strong>
        </span>
      </div>

      {/* 2. Members (compact, Family-safe only) */}
      <div className="mt-3 flex flex-wrap gap-2">
        {state.members.map((member) => (
          <span
            key={member.user_id}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#B7BDC4]"
          >
            {member.display_name || member.email} · {t(ROLE_LABEL_KEY[member.role])} · {t(STATUS_LABEL_KEY[member.status])}
          </span>
        ))}
      </div>

      {/* 3. Active Family Goals */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8E969F]">{t('activeGoalsTitle')}</p>
        {goalsLoading && <p className="mt-2 text-sm text-[#8E969F]">{t('loadingGoals')}</p>}
        {!goalsLoading && goalsError && <p className="mt-2 text-sm text-red-300">{goalsError}</p>}
        {!goalsLoading && !goalsError && activeGoals.length === 0 && (
          <p className="mt-2 text-sm text-[#8E969F]">{t('noActiveGoals')}</p>
        )}
        {!goalsLoading && !goalsError && activeGoals.length > 0 && (
          <div className="mt-2 space-y-2">
            {activeGoals.map((goal) => {
              const own = currentUserEmail ? goal.participants.find((p) => p.email === currentUserEmail) : undefined;
              return (
                <div key={goal.id} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                  <p className="font-semibold text-[#F5F2EA]">{goal.title}</p>
                  <p className="mt-1 text-xs text-[#8E969F]">
                    {goal.participant_count} {t('participantsLabel')} · {goal.completed_count} {t('completedLabel')}
                    {own && ` · ${t('yourProgress')} ${own.progress_value ?? 0}${own.completed ? ` ${t('completedSuffix')}` : ''}`}
                    {!own && currentUserEmail && ` · ${t('notParticipating')}`}
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
          <li>{activeGoals.length} {t('activeGoalsSummary')}</li>
          {state.member_count_active > 0 && (
            <li>
              {participatingUserIds.size} {t('membersParticipatingSummary', { total: state.member_count_active })}
            </li>
          )}
          {pendingInvites > 0 && <li>{pendingInvites} {t('pendingInvitesSummary')}</li>}
          {!challengesLoading && !challengesError && (
            <>
              <li>{activeChallenges.length} {t('activeChallengesSummary')}</li>
              <li>{challengeParticipantIds.size} {t('challengeParticipantsSummary')}</li>
            </>
          )}
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
              {t('inviteMember')}
            </button>
            <button
              onClick={onCreateGoal}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('createGoalAction')}
            </button>
            <button
              onClick={onCreateChallenge}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('createChallengeAction')}
            </button>
          </>
        )}
        {state.role === 'member' && (
          <>
            <button
              onClick={onViewGoals}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('viewGoalsAction')}
            </button>
            <button
              onClick={onViewChallenges}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              {t('viewChallengesAction')}
            </button>
            {state.status === 'active' && (
              <button
                onClick={onLeaveFamily}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
              >
                {t('leaveFamilyAction')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
