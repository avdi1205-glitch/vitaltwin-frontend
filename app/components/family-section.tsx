'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/api';
import FamilyGoalsSection, { type FamilyGoal } from './family-goals-section';
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
};

/**
 * Family Foundation V1 (Beta): reines Mitgliedschafts-Roster (E-Mail,
 * Anzeigename, Rolle, Status) — KEINE gemeinsamen Gesundheitsdaten. Jedes
 * Mitglied bleibt ein vollständig unabhängiges VitalTwin-Konto. Backend:
 * /api/family/*.
 */
export default function FamilySection({ currentUserEmail }: { currentUserEmail?: string | null }) {
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
        setErrorMessage(data?.detail ?? 'Family-Status konnte nicht geladen werden.');
        return;
      }
      setState(data);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  const loadGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError('');
    try {
      const response = await fetch(apiUrl('/api/family/goals'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setGoalsError(data?.detail ?? 'Familienziele konnten nicht geladen werden.');
        return;
      }
      setGoals(data.goals ?? []);
    } catch {
      setGoalsError('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setGoalsLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Family Goals are only meaningful once membership is active — fetched
  // exactly once here and shared by both FamilyOverviewSection and
  // FamilyGoalsSection (no duplicate requests).
  useEffect(() => {
    if (state?.in_family && state.status === 'active') {
      const timer = window.setTimeout(() => void loadGoals(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state?.in_family, state?.status, loadGoals]);

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
        setErrorMessage(data?.detail ?? 'Aktion fehlgeschlagen.');
        return;
      }
      if (typeof data?.email_sent === 'boolean') {
        setActionMessage(
          data.email_sent
            ? 'Einladung gespeichert und E-Mail gesendet.'
            : 'Einladung gespeichert. Es konnte keine E-Mail gesendet werden — informiere die Person bitte direkt.',
        );
      }
      await load();
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
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

  const ROLE_LABEL: Record<string, string> = { owner: 'Owner', member: 'Mitglied' };
  const STATUS_LABEL: Record<string, string> = {
    active: 'Aktiv',
    invited: 'Eingeladen',
    removed: 'Entfernt',
    left: 'Ausgetreten',
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Familie</h2>
        <span className="rounded-full border border-[#58D7D4]/40 px-3 py-1 text-xs font-semibold text-[#58D7D4]">Beta</span>
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">
        Getrennte, unabhängige Konten für bis zu {state?.max_members ?? 6} Personen — jedes Mitglied behält seine eigenen,
        privaten Wellness-Daten. Niemand sieht automatisch die Werte eines anderen Mitglieds.
      </p>

      {loading && <p className="mt-4 text-[#8E969F]">Lädt...</p>}

      {!loading && errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
      {!loading && actionMessage && <p className="mt-4 text-sm text-[#58D7D4]">{actionMessage}</p>}

      {!loading && state && !state.in_family && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          {state.eligible_to_create ? (
            <>
              <p className="text-sm text-[#F5F2EA]">Du bist noch in keiner Family. Starte deine eigene Family-Gruppe.</p>
              <button
                onClick={() => void runAction('/api/family', 'POST')}
                disabled={busy}
                className="mt-3 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy ? 'Erstelle...' : 'Family erstellen'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[#F5F2EA]">Eine Family ist ein Family-Tarif-Feature.</p>
              <a
                href="/preise"
                className="mt-3 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                Family ansehen
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
            onInviteMember={focusInvite}
            onCreateGoal={() => setOpenCreateGoalSignal((n) => n + 1)}
            onViewGoals={scrollToGoals}
            onLeaveFamily={() => void runAction('/api/family/leave', 'POST')}
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F2EA]">
            Deine Rolle: {ROLE_LABEL[state.role ?? ''] ?? state.role} · Status: {STATUS_LABEL[state.status ?? ''] ?? state.status} ·
            Mitglieder: {state.member_count_active} / {state.max_members}
          </div>

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
                {state.role === 'owner' && member.role !== 'owner' && (
                  <button
                    onClick={() => void runAction(`/api/family/members/${member.user_id}`, 'DELETE')}
                    disabled={busy}
                    className="rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            ))}
          </div>

          {state.role === 'owner' && state.status === 'active' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inviteInputRef}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="E-Mail des Familienmitglieds"
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
                Einladen
              </button>
            </div>
          )}

          {state.status === 'invited' && (
            <button
              onClick={() => void runAction('/api/family/accept', 'POST')}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Einladung annehmen
            </button>
          )}

          <button
            id="family-leave-button"
            onClick={() => void runAction('/api/family/leave', 'POST')}
            disabled={busy}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Family verlassen
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
        </div>
      )}
    </section>
  );
}

