'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { apiUrl } from '@/lib/api';
import { DEFAULT_TWIN_FORM } from '@/lib/twin-defaults';
import DashboardDailyPlan from '../components/dashboard-daily-plan';
import DashboardTwinMemory from '../components/dashboard-twin-memory';
import DashboardLearningTimeline from '../components/dashboard-learning-timeline';
import DashboardTwinSummary from '../components/dashboard-twin-summary';
import DashboardAccountMenu, { type DiscountInfo } from '../components/dashboard-account-menu';
import { DomainCard, TodayActionsCard } from '../components/dashboard-cards';
import TwinEmptyState from '../components/brand/TwinEmptyState';
import AdSlot from '../components/AdSlot';
import { useDashboardShell } from './dashboard-shell';

type Translator = (key: string, values?: Record<string, string | number>) => string;

function getGreeting(t: Translator): string {
  const hour = new Date().getHours();
  if (hour < 11) return t('greetingMorning');
  if (hour < 18) return t('greetingAfternoon');
  return t('greetingEvening');
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

type TwinEvolutionSummary = {
  active_domain_count: number;
  data_quality_summary: Record<string, number>;
  comparison: {
    available: boolean;
    reason: string | null;
    explanations: string[];
  };
};

const WATER_HABIT_KEYS: Record<string, 'waterLow' | 'waterMedium' | 'waterHigh'> = { wenig: 'waterLow', mittel: 'waterMedium', viel: 'waterHigh' };

type DomainCardContent = { status: string | null; hint: string };

/**
 * "Tagesübersicht": real values from today's own check-in only — never a
 * computed/fabricated number. Falls back to an honest empty-state hint
 * with a real next action when the field wasn't filled in today.
 */
function domainCardContent(field: 'sleep' | 'movement' | 'nutrition' | 'stress' | 'energy' | 'recovery', checkin: TodayCheckin, t: Translator): DomainCardContent {
  switch (field) {
    case 'sleep':
      if (checkin?.sleep_hours != null) return { status: `${checkin.sleep_hours} Std.`, hint: t('hintSleepHours') };
      if (checkin?.sleep_quality != null) return { status: `${checkin.sleep_quality}/10`, hint: t('hintSleepQuality') };
      return { status: null, hint: t('hintSleepNone') };
    case 'movement':
      if (checkin?.movement_minutes != null) return { status: `${checkin.movement_minutes} Min.`, hint: t('hintMovementGiven') };
      return { status: null, hint: t('hintMovementNone') };
    case 'nutrition':
      if (checkin?.water_habit) return { status: WATER_HABIT_KEYS[checkin.water_habit] ? t(WATER_HABIT_KEYS[checkin.water_habit]) : checkin.water_habit, hint: t('hintNutritionGiven') };
      return { status: null, hint: t('hintNutritionNone') };
    case 'stress':
      if (checkin?.stress != null) return { status: `${checkin.stress}/10`, hint: t('hintStressGiven') };
      return { status: null, hint: t('hintStressNone') };
    case 'energy':
      if (checkin?.energy != null) return { status: `${checkin.energy}/10`, hint: t('hintEnergyGiven') };
      return { status: null, hint: t('hintEnergyNone') };
    case 'recovery':
      if (checkin?.recovery != null) return { status: `${checkin.recovery}/10`, hint: t('hintRecoveryGiven') };
      return { status: null, hint: t('hintRecoveryNone') };
  }
}

type NextStep = { headline: string; text: string; ctaLabel: string | null; ctaHref: string | null } | null;

/**
 * Onboarding-Gate anhand des ECHTEN Datenstands (Check-ins, Twin-Berechnungen)
 * plus `onboarding_completed` — kein Fake-Fortschrittsbalken, keine erfundene
 * Prozentzahl, nur eine klare nächste Aktion.
 */
function nextStepFor(onboardingCompleted: boolean | null, checkinCount: number | null, historyCount: number, t: Translator): NextStep {
  if (onboardingCompleted === null || checkinCount === null) return null;

  if (!onboardingCompleted && checkinCount === 0 && historyCount === 0) {
    return {
      headline: t('welcomeHeadline'),
      text: t('welcomeText'),
      ctaLabel: t('startOnboarding'),
      ctaHref: '/onboarding',
    };
  }
  if (checkinCount === 0) {
    return {
      headline: t('nextStepHeadline'),
      text: t('firstCheckinText'),
      ctaLabel: t('firstCheckinButton'),
      ctaHref: '/dashboard/gewohnheiten',
    };
  }
  if (historyCount === 0) {
    return {
      headline: t('nextStepHeadline'),
      text: t('markersText'),
      ctaLabel: t('markersButton'),
      ctaHref: '/dashboard/mein-twin',
    };
  }
  if (checkinCount < 7) {
    return {
      headline: t('learningHeadline'),
      text: t('learningText', { count: checkinCount, checkinWord: checkinCount === 1 ? t('checkinSingular') : t('checkinPlural') }),
      ctaLabel: t('moreCheckinButton'),
      ctaHref: '/dashboard/gewohnheiten',
    };
  }
  return null;
}

function planDisplayLabel(profile: { premium: boolean; plan?: string; beta?: { plan: string } | null } | null | undefined, t: Translator): string {
  if (!profile) return t('planUnknown');
  if (!profile.premium) return t('planStarter');
  const planKeys: Record<string, string> = { premium: t('planPremium'), pro: t('planPro'), family: t('planFamily') };
  const label = planKeys[profile.plan || 'premium'] || t('planPremium');
  // Beta Tester Program: a subtle, honest label — never claims this is a
  // paid subscription (distinct from the pre-existing free "Beta-Zugang"
  // self-service activation, which has no admin-granted grant behind it).
  return profile.beta ? `${label} · ${t('betaTester')}` : label;
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
  const t = useTranslations('dashboard');
  const cardsT = useTranslations('cards');
  const locale = useLocale();
  const isMountedRef = useRef(true);
  const autoStarterTriggeredRef = useRef(false);

  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [latest, setLatest] = useState<HistoryItem | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkinCount, setCheckinCount] = useState<number | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [evolution, setEvolution] = useState<TwinEvolutionSummary | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountLoading, setDiscountLoading] = useState(true);

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

  // Lifted up from DashboardTwinSummary (was fetched there before) so the
  // header's Kernaussage and the "Dein persönlicher Twin" section share the
  // SAME response instead of firing the request twice.
  const fetchEvolution = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl(`/api/profile/twin-evolution?locale=${locale}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMountedRef.current) return;
      if (response.ok) setEvolution((await response.json()) as TwinEvolutionSummary);
    } catch {
      // Non-fatal — Kernaussage fällt still auf die generische Formulierung zurück.
    } finally {
      if (isMountedRef.current) setEvolutionLoading(false);
    }
  }, [locale]);

  const fetchDiscount = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/beta/my-discount'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!isMountedRef.current) return;
      if (response.ok) setDiscountInfo((await response.json()) as DiscountInfo);
    } catch {
      // Non-fatal — Rabatt-Status fällt still auf den generischen Beta-Button zurück.
    } finally {
      if (isMountedRef.current) setDiscountLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const timer = window.setTimeout(() => {
      void fetchLatest(token);
      void fetchTodayCheckin(token);
      void fetchOnboardingState(token);
      void fetchEvolution(token);
      void fetchDiscount(token);
    }, 0);

    const params = new URLSearchParams(window.location.search);
    let paymentNoticeTimer: number | undefined;
    let paymentTimer: number | undefined;
    if (params.get('payment') === 'success') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage(t('paymentSuccess'));
      }, 0);
      paymentTimer = window.setTimeout(() => {
        refetchProfile();
        void fetchLatest(token);
      }, 1800);
    } else if (params.get('beta') === 'activated') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage(t('betaActivated'));
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
  }, [fetchDiscount, fetchEvolution, fetchLatest, fetchOnboardingState, fetchTodayCheckin, refetchProfile, t]);

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
        const res = await fetch(apiUrl(`/api/twin/calculate?locale=${locale}`), {
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
  }, [fetchLatest, latest, loadingLatest, loadingProfile, locale, profile, setProfile, twin]);

  const displayedTwin: TwinResponse | null = twin ?? (latest
    ? { biologisches_alter: latest.biologisches_alter, differenz: latest.differenz, empfehlungen: [] }
    : null);

  const nextStep = nextStepFor(onboardingCompleted, checkinCount, latest ? 1 : 0, t);

  // Kernaussage: der bereits abgerufene, echte Twin-Vergleichssatz statt der
  // generischen Einleitung -- still auf die generische Formulierung zurück,
  // solange geladen wird oder wenn kein Vergleich verfügbar ist (kein
  // sichtbarer Fehlerzustand, siehe Punkt 6/9).
  const coreStatement = evolutionLoading
    ? null
    : evolution?.comparison.available && evolution.comparison.explanations.length > 0
      ? evolution.comparison.explanations[0]
      : t('overviewIntro');

  return (
    <>
      <header className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">VitalTwin Intelligence</p>
            <h1
              className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-5xl"
              suppressHydrationWarning
            >
              {getGreeting(t)}{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            {coreStatement === null ? (
              <span className="mt-3 block h-5 w-2/3 animate-pulse rounded bg-white/10" />
            ) : (
              <p className="mt-3 text-[#B7BDC4]">{coreStatement}</p>
            )}
            {profile?.beta?.expires_at && (
              <p className="mt-1 text-xs text-[#8E969F]">
                {t('betaExpires', { date: new Date(profile.beta.expires_at).toLocaleDateString(locale) })} {t('betaNoPaymentNote')}
              </p>
            )}
          </div>

          <DashboardAccountMenu
            planLabel={loadingProfile ? t('loading') : !profile ? t('planUnknown') : planDisplayLabel(profile, t)}
            isPremium={Boolean(profile?.premium)}
            showBetaUnlock={!loadingProfile && Boolean(profile) && !profile?.premium}
            discount={discountInfo}
            discountLoading={discountLoading}
            onProfile={() => router.push('/profil')}
            onPasswordReset={() => router.push('/passwort-zuruecksetzen')}
            onLogout={logout}
          />
        </div>
      </header>

      <section id="uebersicht" className="scroll-mt-24">
        {paymentMessage && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[#F5F2EA]">
            {paymentMessage}
          </div>
        )}

        <DashboardTwinSummary
          hasCheckinToday={Boolean(todayCheckin)}
          hasBiomarkerTwin={Boolean(displayedTwin)}
          isPremium={Boolean(profile?.premium)}
          evolution={evolution}
          evolutionLoading={evolutionLoading}
        />

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
          {t('overviewSectionTitle')}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DomainCard label={t('domainSleep')} status={domainCardContent('sleep', todayCheckin, t).status} hint={domainCardContent('sleep', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label={t('domainMovement')} status={domainCardContent('movement', todayCheckin, t).status} hint={domainCardContent('movement', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label={t('domainNutrition')} status={domainCardContent('nutrition', todayCheckin, t).status} hint={domainCardContent('nutrition', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label={t('domainStress')} status={domainCardContent('stress', todayCheckin, t).status} hint={domainCardContent('stress', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label={t('domainEnergy')} status={domainCardContent('energy', todayCheckin, t).status} hint={domainCardContent('energy', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
          <DomainCard label={t('domainRecovery')} status={domainCardContent('recovery', todayCheckin, t).status} hint={domainCardContent('recovery', todayCheckin, t).hint} detailHref="/dashboard/gewohnheiten" />
        </div>

        <h2 className="mt-10 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          {t('biomarkerTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
          {t('biomarkerDescription')}
        </p>
        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">{t('statusLabel')}</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">
              {loadingProfile ? t('loading') : profile?.premium ? t('activePlanStatus', { plan: planDisplayLabel(profile, t) }) : t('activePlanStatus', { plan: t('planStarter') })}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">{t('ageLabel')}</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{displayedTwin ? `${displayedTwin.biologisches_alter} ${t('ageUnit')}` : t('ageNoData')}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-[#8E969F]">{t('diffLabel')}</p>
            <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">
              {displayedTwin ? `${displayedTwin.differenz > 0 ? '+' : ''}${displayedTwin.differenz} ${t('ageUnit')}` : '-'}
            </p>
          </article>
        </section>
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#B7BDC4]">
          {t('biomarkerDisclaimer')}
        </p>

        {!loadingLatest && !displayedTwin && (
          <div className="mt-6">
            <TwinEmptyState
              subtext={t('emptyTwinState')}
              onRetry={() => router.push('/dashboard/mein-twin')}
            />
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TodayActionsCard title={cardsT('todayTitle')} actions={displayedTwin?.empfehlungen ?? []} />
        </div>

        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#B7BDC4]">
            {t('freePlanPrefix')}{' '}
            <Link href="/preise" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
              {t('freePlanLink')}
            </Link>
            .
          </div>
        )}
        {!loadingProfile && profile?.premium && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#B7BDC4]">
            {t('premiumPlanPrefix')} <span className="font-semibold text-[#F5F2EA]">{planDisplayLabel(profile, t)}</span>
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
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('chatSectionTitle')}</h3>
        <p className="mt-2 text-sm text-[#B7BDC4]">
          {t('chatDescription')}
        </p>
        <Link
          href="/frag-deinen-twin"
          className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          {t('chatButton')}
        </Link>
      </article>
    </>
  );
}
