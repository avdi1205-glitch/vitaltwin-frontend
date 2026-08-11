'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { DEFAULT_TWIN_FORM } from '@/lib/twin-defaults';
import DashboardDailyPlan from '../components/dashboard-daily-plan';
import DashboardTwinMemory from '../components/dashboard-twin-memory';
import DashboardLearningTimeline from '../components/dashboard-learning-timeline';
import { DomainCard, TodayActionsCard } from '../components/dashboard-cards';
import TwinEmptyState from '../components/brand/TwinEmptyState';
import AdSlot from '../components/AdSlot';
import { useDashboardShell } from './dashboard-shell';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

// Old anchor URLs (from the previous single-page /dashboard) redirected to
// their real routes (Phase 7: keine kaputten internen/gebookmarkten Links).
const LEGACY_ANCHOR_ROUTES: Record<string, string> = {
  '#cgm-ernaehrung': '/dashboard/blutzucker',
  '#gewohnheiten': '/dashboard/gewohnheiten',
  '#mein-twin': '/dashboard/mein-twin',
  '#verlauf': '/dashboard/verlauf',
};

type TwinResponse = {
  biologisches_alter: number;
  differenz: number;
  empfehlungen: string[];
};

type HistoryItem = {
  id: number;
  created_at: string;
  biologisches_alter: number;
  differenz: number;
};

type TodayCheckin = {
  entry_date: string;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  movement_minutes?: number | null;
  water_habit?: string | null;
  stress?: number | null;
  energy?: number | null;
  recovery?: number | null;
} | null;

const WATER_HABIT_LABELS: Record<string, string> = { wenig: 'Wenig Wasser', mittel: 'Mittel viel Wasser', viel: 'Viel Wasser' };

type DomainCardContent = { status: string | null; hint: string };

/**
 * "Tagesübersicht": real values from today's own check-in only — never a
 * computed/fabricated number. Falls back to an honest empty-state hint
 * with a real next action when the field wasn't filled in today.
 */
function domainCardContent(field: 'sleep' | 'movement' | 'nutrition' | 'stress' | 'energy' | 'recovery', checkin: TodayCheckin): DomainCardContent {
  switch (field) {
    case 'sleep':
      if (checkin?.sleep_hours != null) return { status: `${checkin.sleep_hours} Std.`, hint: 'Heutige Schlafdauer aus deinem Check-in.' };
      if (checkin?.sleep_quality != null) return { status: `${checkin.sleep_quality}/10`, hint: 'Heutige Schlafqualität aus deinem Check-in.' };
      return { status: null, hint: 'Schlaf im heutigen Check-in ergänzen.' };
    case 'movement':
      if (checkin?.movement_minutes != null) return { status: `${checkin.movement_minutes} Min.`, hint: 'Heutige Bewegung aus deinem Check-in.' };
      return { status: null, hint: 'Bewegung im heutigen Check-in ergänzen.' };
    case 'nutrition':
      if (checkin?.water_habit) return { status: WATER_HABIT_LABELS[checkin.water_habit] ?? checkin.water_habit, hint: 'Heutige Wasserzufuhr aus deinem Check-in.' };
      return { status: null, hint: 'Ernährung/Wasser im heutigen Check-in ergänzen.' };
    case 'stress':
      if (checkin?.stress != null) return { status: `${checkin.stress}/10`, hint: 'Heutiger Stresswert aus deinem Check-in.' };
      return { status: null, hint: 'Stress im heutigen Check-in ergänzen.' };
    case 'energy':
      if (checkin?.energy != null) return { status: `${checkin.energy}/10`, hint: 'Heutige Energie aus deinem Check-in.' };
      return { status: null, hint: 'Energie im heutigen Check-in ergänzen.' };
    case 'recovery':
      if (checkin?.recovery != null) return { status: `${checkin.recovery}/10`, hint: 'Heutige Erholung aus deinem Check-in.' };
      return { status: null, hint: 'Erholung im heutigen Check-in ergänzen (unter "Motivation, Erholung, Notiz").' };
  }
}

type NextStep = { headline: string; text: string; ctaLabel: string | null; ctaHref: string | null } | null;

/**
 * Onboarding-Gate anhand des ECHTEN Datenstands (Check-ins, Twin-Berechnungen)
 * plus `onboarding_completed` — kein Fake-Fortschrittsbalken, keine erfundene
 * Prozentzahl, nur eine klare nächste Aktion.
 */
function nextStepFor(onboardingCompleted: boolean | null, checkinCount: number | null, historyCount: number): NextStep {
  if (onboardingCompleted === null || checkinCount === null) return null;

  if (!onboardingCompleted && checkinCount === 0 && historyCount === 0) {
    return {
      headline: 'Willkommen bei deinem VitalTwin',
      text: 'Starte mit dem kurzen Onboarding, damit dein Twin deine Ziele und ersten Gewohnheiten kennt.',
      ctaLabel: 'Onboarding starten',
      ctaHref: '/onboarding',
    };
  }
  if (checkinCount === 0) {
    return {
      headline: 'Dein nächster Schritt',
      text: 'Noch kein Check-in vorhanden. Mit deinem ersten Check-in beginnt dein Twin, deinen Verlauf aufzubauen.',
      ctaLabel: 'Ersten Check-in durchführen',
      ctaHref: '/dashboard/gewohnheiten',
    };
  }
  if (historyCount === 0) {
    return {
      headline: 'Dein nächster Schritt',
      text: 'Du hast bereits Check-ins erfasst. Ergänze jetzt deine Wellness-Marker für dein erstes Ergebnis.',
      ctaLabel: 'Marker ergänzen',
      ctaHref: '/dashboard/mein-twin',
    };
  }
  if (checkinCount < 7) {
    return {
      headline: 'Dein Twin lernt dich noch kennen',
      text: `Bisher ${checkinCount} ${checkinCount === 1 ? 'Check-in' : 'Check-ins'}. Mit ein paar weiteren Tagen werden Trends und Empfehlungen zuverlässiger.`,
      ctaLabel: 'Weiteren Check-in ergänzen',
      ctaHref: '/dashboard/gewohnheiten',
    };
  }
  return null;
}

const PLAN_DISPLAY_LABELS: Record<string, string> = { premium: 'Premium', pro: 'Pro', family: 'Family' };

function planDisplayLabel(profile: { premium: boolean; plan?: string } | null | undefined): string {
  if (!profile) return 'Unbekannt';
  if (!profile.premium) return 'Starter';
  return PLAN_DISPLAY_LABELS[profile.plan || 'premium'] || 'Beta-Zugang';
}

/**
 * Übersicht — die leichteste Dashboard-Seite (Phase 6): lädt beim ersten
 * Aufruf nur Nutzer+Tarif (geteilt via Layout-Context), den heutigen
 * Check-in, den letzten Twin-Stand (limit=1, NICHT die volle Historie) sowie
 * die für Onboarding/nächsten-Schritt nötigen Zähler — keine CGM-Historie,
 * keine 90-Tage-Trends, keine Gewohnheiten-Listen.
 */
export default function Dashboard() {
  const { profile, loadingProfile, refetchProfile, setProfile, logout } = useDashboardShell();
  const router = useRouter();
  const isMountedRef = useRef(true);
  const autoStarterTriggeredRef = useRef(false);

  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [latest, setLatest] = useState<HistoryItem | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkinCount, setCheckinCount] = useState<number | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Phase 7: alte #anchor-Links auf die neuen echten Routen weiterleiten.
  useEffect(() => {
    const target = LEGACY_ANCHOR_ROUTES[window.location.hash];
    if (target) router.replace(target);
  }, [router]);

  const fetchLatest = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/twin/history?limit=1'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => null)) as { items?: HistoryItem[] } | null;
      if (!isMountedRef.current) return;
      if (response.ok) {
        setLatest(Array.isArray(data?.items) && data.items.length > 0 ? data.items[0] : null);
      }
    } catch {
      // Non-fatal — Gesamtstatus zeigt dann "Noch keine Berechnung".
    } finally {
      if (isMountedRef.current) setLoadingLatest(false);
    }
  }, []);

  const fetchTodayCheckin = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/profile/daily/today'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => null)) as { item?: TodayCheckin } | null;
      if (!isMountedRef.current) return;
      if (response.ok) setTodayCheckin(data?.item ?? null);
    } catch {
      // Non-fatal — Tagesübersicht fällt auf ihren ehrlichen Empty-State zurück.
    }
  }, []);

  const fetchOnboardingState = useCallback(async (token: string) => {
    try {
      // nextStepFor() only distinguishes 0 / <7 / >=7 check-ins — the
      // backend already caps rows to whatever `days` is passed, so 7 is
      // enough to make that exact distinction (was 90, a needlessly heavy
      // full-row payload just to compute a small count on this light page).
      const [profileRes, dailyRes] = await Promise.all([
        fetch(apiUrl('/api/profile/me'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/profile/daily?days=7'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const profileData = (await profileRes.json().catch(() => null)) as { onboarding_completed?: boolean } | null;
      const dailyData = (await dailyRes.json().catch(() => null)) as { items?: unknown[] } | null;
      if (!isMountedRef.current) return;
      if (profileRes.ok) setOnboardingCompleted(Boolean(profileData?.onboarding_completed));
      if (dailyRes.ok) setCheckinCount(Array.isArray(dailyData?.items) ? dailyData.items.length : 0);
    } catch {
      // Non-fatal — der "nächster Schritt"-Hinweis bleibt einfach verborgen.
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const timer = window.setTimeout(() => {
      void fetchLatest(token);
      void fetchTodayCheckin(token);
      void fetchOnboardingState(token);
    }, 0);

    const params = new URLSearchParams(window.location.search);
    let paymentNoticeTimer: number | undefined;
    let paymentTimer: number | undefined;
    if (params.get('payment') === 'success') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage('Zahlung erfolgreich. Dein Plan wird jetzt synchronisiert...');
      }, 0);
      paymentTimer = window.setTimeout(() => {
        refetchProfile();
        void fetchLatest(token);
      }, 1800);
    } else if (params.get('beta') === 'activated') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage('Beta-Zugang aktiviert. Keine automatische Zahlung während der Beta-Phase.');
      }, 0);
      paymentTimer = window.setTimeout(() => {
        refetchProfile();
        void fetchLatest(token);
      }, 700);
    }

    return () => {
      window.clearTimeout(timer);
      if (paymentNoticeTimer) window.clearTimeout(paymentNoticeTimer);
      if (paymentTimer) window.clearTimeout(paymentTimer);
    };
  }, [fetchLatest, fetchOnboardingState, fetchTodayCheckin, refetchProfile]);

  // Starter erhält weiterhin automatisch genau eine kostenlose Erstberechnung
  // (unverändertes Verhalten/Werte, jetzt über die geteilte DEFAULT_TWIN_FORM-
  // Konstante statt eines vollen Formulars auf dieser leichten Seite).
  useEffect(() => {
    if (loadingProfile || loadingLatest || autoStarterTriggeredRef.current) return;
    if (!profile || profile.premium) return;
    if (profile.starter_calc_remaining === 0) return;
    if (latest || twin) return;

    autoStarterTriggeredRef.current = true;
    const timer = window.setTimeout(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(apiUrl('/api/twin/calculate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...DEFAULT_TWIN_FORM, family_context: [], token }),
        });
        if (res.ok) {
          const data = (await res.json()) as TwinResponse;
          if (!isMountedRef.current) return;
          setTwin(data);
          setProfile((current) => (current ? { ...current, starter_calc_remaining: 0 } : current));
          void fetchLatest(token);
        }
      } catch {
        // Non-fatal — Nutzer kann die Berechnung manuell auf Mein Twin starten.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchLatest, latest, loadingLatest, loadingProfile, profile, setProfile, twin]);

  const displayedTwin: TwinResponse | null = twin ?? (latest
    ? { biologisches_alter: latest.biologisches_alter, differenz: latest.differenz, empfehlungen: [] }
    : null);

  const nextStep = nextStepFor(onboardingCompleted, checkinCount, latest ? 1 : 0);

  return (
    <>
      <header className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">VitalTwin Intelligence</p>
            <h1
              className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-5xl"
              suppressHydrationWarning
            >
              {getGreeting()}{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="mt-3 text-[#B7BDC4]">Hier ist dein heutiger VitalTwin-Überblick.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-1 text-sm font-semibold ${profile?.premium ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'border border-white/20 text-[#B7BDC4]'}`}>
              Plan: {loadingProfile ? 'Lädt...' : !profile ? 'Unbekannt' : planDisplayLabel(profile)}
            </span>
            {!loadingProfile && profile && !profile.premium && (
              <button
                onClick={() => router.push('/preise')}
                className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                Beta freischalten
              </button>
            )}
            <button
              onClick={() => router.push('/profil')}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Profil
            </button>
            <button
              onClick={() => router.push('/passwort-zuruecksetzen')}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Passwort ändern
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-red-400/30 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <section id="uebersicht" className="scroll-mt-24">
        {paymentMessage && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[#F5F2EA]">
            {paymentMessage}
          </div>
        )}

        {nextStep && (
          <div className="mt-6 rounded-2xl border border-[#58D7D4]/30 bg-white/[0.03] px-5 py-5">
            <p className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">{nextStep.headline}</p>
            <p className="mt-2 text-sm text-[#B7BDC4]">{nextStep.text}</p>
            {nextStep.ctaLabel && nextStep.ctaHref && (
              <Link
                href={nextStep.ctaHref}
                className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {nextStep.ctaLabel}
              </Link>
            )}
          </div>
        )}

        <h2 className="mt-8 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          Tagesübersicht
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DomainCard label="Schlaf" status={domainCardContent('sleep', todayCheckin).status} hint={domainCardContent('sleep', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label="Bewegung" status={domainCardContent('movement', todayCheckin).status} hint={domainCardContent('movement', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label="Ernährung" status={domainCardContent('nutrition', todayCheckin).status} hint={domainCardContent('nutrition', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label="Stress" status={domainCardContent('stress', todayCheckin).status} hint={domainCardContent('stress', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label="Energie" status={domainCardContent('energy', todayCheckin).status} hint={domainCardContent('energy', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label="Erholung" status={domainCardContent('recovery', todayCheckin).status} hint={domainCardContent('recovery', todayCheckin).hint} detailHref="/dashboard/gewohnheiten" />
        </div>

        <h2 className="mt-10 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          VitalTwin-Gesamtstatus
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
          Dein Status basiert ausschließlich auf den Biomarkern, die du im Bereich „Mein Twin&quot; einträgst. Es handelt
          sich um keine medizinische Risikobewertung und keine wissenschaftlich exakte Messung, sondern um eine grobe
          Wellness-Orientierung.
        </p>
        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">Status</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">
              {loadingProfile ? 'Lade...' : profile?.premium ? `${planDisplayLabel(profile)} aktiv` : 'Starter aktiv'}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">Biologisches Alter</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{displayedTwin ? `${displayedTwin.biologisches_alter} Jahre` : 'Noch keine Berechnung'}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">Differenz</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">
              {displayedTwin ? `${displayedTwin.differenz > 0 ? '+' : ''}${displayedTwin.differenz} Jahre` : '-'}
            </p>
          </article>
        </section>
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#B7BDC4]">
          Diese Schätzung dient ausschließlich der Wellness-Orientierung und ist keine medizinische Bewertung.
          Einfließende Daten: Alter, Geschlecht, HbA1c, CRP, Vitamin D, ApoB und die weiteren von dir eingetragenen
          Marker.
        </p>

        {!loadingLatest && !displayedTwin && (
          <div className="mt-6">
            <TwinEmptyState
              subtext="Noch keine Twin-Berechnung vorhanden."
              onRetry={() => router.push('/dashboard/mein-twin')}
            />
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TodayActionsCard title="Heute für dich" actions={displayedTwin?.empfehlungen ?? []} />
        </div>

        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#B7BDC4]">
            Du nutzt aktuell Free.{' '}
            <Link href="/preise" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
              Mehr Möglichkeiten mit Premium ansehen
            </Link>
            .
          </div>
        )}
        {!loadingProfile && profile?.premium && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#B7BDC4]">
            Aktueller Tarif: <span className="font-semibold text-[#F5F2EA]">{planDisplayLabel(profile)}</span>
          </div>
        )}

        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-8">
            <AdSlot slot="2260528919" />
          </div>
        )}
      </section>

      <div className="mt-8">
        <DashboardDailyPlan />
      </div>

      <div className="mt-6">
        <DashboardTwinMemory />
      </div>

      <div className="mt-6">
        <DashboardLearningTimeline />
      </div>

      <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Frag deinen Twin</h3>
        <p className="mt-2 text-sm text-[#B7BDC4]">
          Stelle deinem digitalen Zwilling Fragen zu deiner Entwicklung — er antwortet auf Basis deiner eigenen Daten,
          immer mit Quellenangabe und „Warum?&quot;.
        </p>
        <Link
          href="/frag-deinen-twin"
          className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          Twin fragen
        </Link>
      </article>
    </>
  );
}
