'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import DashboardNav from '../components/dashboard-nav';
import DashboardHabits from '../components/dashboard-habits';
import DashboardCheckin from '../components/dashboard-checkin';
import DashboardGoals from '../components/dashboard-goals';
import DashboardTrends from '../components/dashboard-trends';
import DashboardRecommendations from '../components/dashboard-recommendations';
import DashboardTwinMemory from '../components/dashboard-twin-memory';
import DashboardDailyPlan from '../components/dashboard-daily-plan';
import DashboardTwinProgress from '../components/dashboard-twin-progress';
import { DomainCard, TodayActionsCard } from '../components/dashboard-cards';
import TwinEmptyState from '../components/brand/TwinEmptyState';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

type TwinResponse = {
  biologisches_alter: number;
  differenz: number;
  scenarios: {
    aktuell: number;
    optimiert: number;
    aggressiv: number;
  };
  methodik?: {
    typ: string;
    hinweis: string;
  };
  marker_references?: MarkerReference[];
  empfehlungen: string[];
  familienkontext_hinweis?: string | null;
};

type MarkerReference = {
  marker: string;
  unit: string;
  target_min: number | null;
  target_max: number | null;
  warn_min: number | null;
  warn_max: number | null;
  source_name: string;
  source_url: string;
  evidence_level: string;
  population_note: string;
};

type ProfileResponse = {
  email: string;
  full_name?: string | null;
  premium: boolean;
  starter_calc_remaining?: number | null;
};

type HistoryItem = {
  id: number;
  created_at: string;
  biologisches_alter: number;
  differenz: number;
  scenarios?: {
    aktuell?: number;
    optimiert?: number;
    aggressiv?: number;
  };
  hba1c: number;
  crp: number;
  vitamin_d: number;
  apob: number;
};

export default function Dashboard() {
  const [form, setForm] = useState({
    age: 42,
    gender: 'männlich',
    hba1c: 5.4,
    crp: 0.8,
    vitamin_d: 55,
    apob: 65,
    fasting_glucose: 92,
    hdl: 55,
    triglycerides: 110,
    homocysteine: 9,
    tsh: 1.8,
    ferritin: 90,
    vitamin_b12: 500,
    omega3_index: 6,
    resting_heart_rate: 65,
    blood_pressure_systolic: 122,
    blood_pressure_diastolic: 78,
    waist_circumference: 88,
    sleep_hours: 6.8,
    grip_strength: 35,
  });
  const [showMoreMarkers, setShowMoreMarkers] = useState(false);
  const [familyContext, setFamilyContext] = useState<string[]>([]);
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progressCounts, setProgressCounts] = useState({ week: 0, month: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [cgmData, setCgmData] = useState<{ timestamp: string; glucose_value: number; source?: string }[]>([]);
  const [nutritionForm, setNutritionForm] = useState({
    meal_name: '',
    carbs: '',
    protein: '',
    fat: '',
    calories: '',
  });
  const [cgmUploading, setCgmUploading] = useState(false);
  const [cgmMessage, setCgmMessage] = useState('');
  const [nutritionMessage, setNutritionMessage] = useState('');
  const autoStarterTriggeredRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Derives week/month calculation counts from history. Kept in an effect
    // (rather than computed directly during render) because it depends on
    // the current wall-clock time (Date.now()), which is an impure value.
    const now = Date.now();
    const week = history.filter((item) => now - new Date(item.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
    const month = history.filter((item) => now - new Date(item.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgressCounts({ week, month });
  }, [history]);

  const fetchProfile = useCallback(async (token: string) => {
    // A blocked/failed request (e.g. browser extensions, transient network issues) should not
    // make the UI briefly claim "Starter" for a Beta/Premium account, so we retry once silently
    // before giving up.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(apiUrl('/api/users/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json().catch(() => null)) as ProfileResponse | { detail?: string } | null;

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/?auth=login');
            return;
          }
          setErrorMessage(data && 'detail' in data ? data.detail ?? 'Profil konnte nicht geladen werden.' : 'Profil konnte nicht geladen werden.');
          setLoadingProfile(false);
          return;
        }

        setProfile(data as ProfileResponse);
        setLoadingProfile(false);
        return;
      } catch {
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          continue;
        }
        setErrorMessage('Backend nicht erreichbar. Bitte versuche es in wenigen Sekunden erneut.');
        setLoadingProfile(false);
      }
    }
  }, [router]);

  const fetchHistory = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/twin/history?limit=8'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json().catch(() => null)) as { items?: HistoryItem[]; detail?: string } | null;

      if (!response.ok) {
        if (response.status !== 401 && data?.detail) {
          setErrorMessage(data.detail);
        }
        return;
      }

      setHistory(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    const profileTimer = window.setTimeout(() => {
      void fetchProfile(token);
      void fetchHistory(token);
    }, 0);

    const params = new URLSearchParams(window.location.search);
    let paymentNoticeTimer: number | undefined;
    let paymentTimer: number | undefined;
    if (params.get('payment') === 'success') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage('Zahlung erfolgreich. Dein Plan wird jetzt synchronisiert...');
      }, 0);
      paymentTimer = window.setTimeout(() => {
        void fetchProfile(token);
        void fetchHistory(token);
      }, 1800);
    } else if (params.get('beta') === 'activated') {
      paymentNoticeTimer = window.setTimeout(() => {
        setPaymentMessage('Beta-Zugang aktiviert. Keine automatische Zahlung während der Beta-Phase.');
      }, 0);
      paymentTimer = window.setTimeout(() => {
        void fetchProfile(token);
        void fetchHistory(token);
      }, 700);
    }

    return () => {
      window.clearTimeout(profileTimer);
      if (paymentNoticeTimer) {
        window.clearTimeout(paymentNoticeTimer);
      }
      if (paymentTimer) {
        window.clearTimeout(paymentTimer);
      }
    };
  }, [fetchHistory, fetchProfile, router]);

  const calculate = useCallback(async () => {
    setErrorMessage('');

    if (!profile) {
      return;
    }

    if (!profile.premium && profile.starter_calc_remaining === 0) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, family_context: familyContext, token }),
      });

      const data = (await res.json().catch(() => null)) as TwinResponse | { detail?: string } | null;

      if (!res.ok) {
        const detail = data && 'detail' in data ? data.detail ?? '' : '';
        if (typeof detail === 'string' && detail.toLowerCase().includes('starter')) {
          // Starter limit is already explained by the dedicated info banner.
          return;
        }
        setErrorMessage(detail || 'Berechnung fehlgeschlagen.');
        return;
      }

      setTwin(data as TwinResponse);
      if (!profile?.premium) {
        setProfile((current) => (current ? { ...current, starter_calc_remaining: 0 } : current));
      }
      if (token) {
        void fetchHistory(token);
      }
    } catch {
      setErrorMessage('Berechnung aktuell nicht verfügbar. Bitte prüfe die API-Verbindung.');
    } finally {
      setLoading(false);
    }
  }, [familyContext, fetchHistory, form, profile]);

  useEffect(() => {
    if (loadingProfile || loadingHistory || autoStarterTriggeredRef.current) {
      return;
    }

    if (!profile) {
      return;
    }

    if (profile.premium) {
      return;
    }

    if (profile.starter_calc_remaining === 0) {
      return;
    }

    if (history.length > 0 || twin) {
      return;
    }

    autoStarterTriggeredRef.current = true;
    const timer = window.setTimeout(() => {
      void calculate();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [calculate, history.length, loadingHistory, loadingProfile, profile, twin]);

  const displayedTwin: TwinResponse | null = twin ?? (history.length > 0
    ? {
      biologisches_alter: history[0].biologisches_alter,
      differenz: history[0].differenz,
      scenarios: {
        aktuell: history[0].scenarios?.aktuell ?? history[0].biologisches_alter,
        optimiert: history[0].scenarios?.optimiert ?? history[0].biologisches_alter,
        aggressiv: history[0].scenarios?.aggressiv ?? history[0].biologisches_alter,
      },
      methodik: {
        typ: 'Wellness-Orientierung',
        hinweis: 'Angezeigt wird deine letzte gespeicherte Berechnung.',
      },
      marker_references: [],
      empfehlungen: [
        'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
        'Kontrolliere deine Marker regelmäßig für bessere Vergleichbarkeit.',
      ],
    }
    : null);

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const submitFeedback = async () => {
    setFeedbackMessage('');
    if (feedbackText.trim().length < 5) {
      setFeedbackMessage('Bitte gib mindestens 5 Zeichen Feedback ein.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    setSendingFeedback(true);
    try {
      const response = await fetch(apiUrl('/api/users/feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: feedbackScore,
          message: feedbackText.trim(),
          source: 'dashboard',
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedbackMessage(data?.detail ?? 'Feedback konnte nicht gesendet werden.');
        return;
      }

      setFeedbackText('');
      setFeedbackScore(5);
      setFeedbackMessage(data?.message ?? 'Danke für dein Feedback!');
    } catch {
      setFeedbackMessage('Feedback-Service gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const loadCgm = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/health/cgm?days=7'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCgmData(data);
      }
    } catch {
      // Stiller Fehlschlag beim Nachladen — die Upload-Aktion selbst zeigt bei Bedarf eine Fehlermeldung.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCgm();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCgm]);

  const handleCgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    setCgmUploading(true);
    setCgmMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(apiUrl('/api/health/cgm/upload-csv'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setCgmMessage(`✅ ${data?.count ?? 0} echte Messwerte importiert`);
        void loadCgm();
      } else {
        setCgmMessage(`❌ ${data?.detail ?? 'Fehler beim Upload'}`);
      }
    } catch {
      setCgmMessage('❌ Netzwerkfehler');
    } finally {
      setCgmUploading(false);
      e.target.value = '';
    }
  };

  const saveNutrition = async () => {
    setNutritionMessage('');
    if (!nutritionForm.meal_name.trim()) {
      setNutritionMessage('❌ Bitte gib eine Mahlzeit an.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/health/nutrition'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meal_name: nutritionForm.meal_name.trim(),
          carbs: Number(nutritionForm.carbs) || 0,
          protein: Number(nutritionForm.protein) || 0,
          fat: Number(nutritionForm.fat) || 0,
          calories: Number(nutritionForm.calories) || 0,
        }),
      });

      if (response.ok) {
        setNutritionMessage('✅ Mahlzeit gespeichert');
        setNutritionForm({ meal_name: '', carbs: '', protein: '', fat: '', calories: '' });
      } else {
        const data = await response.json().catch(() => null);
        setNutritionMessage(`❌ ${data?.detail ?? 'Fehler beim Speichern'}`);
      }
    } catch {
      setNutritionMessage('❌ Netzwerkfehler');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <DashboardNav />
        <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">VitalTwin Intelligence</p>
              <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-5xl">
                {getGreeting()}{profile?.full_name ? `, ${profile.full_name}` : ''}
              </h1>
              <p className="mt-3 text-[#B7BDC4]">Hier ist dein heutiger VitalTwin-Überblick.</p>
            </div>


            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1 text-sm font-semibold ${profile?.premium ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'border border-white/20 text-[#B7BDC4]'}`}>
                Plan: {loadingProfile ? 'Lädt...' : !profile ? 'Unbekannt' : profile.premium ? 'Beta-Zugang' : 'Starter'}
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
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#B7BDC4]">
            Dieses Dashboard ist ein Wellness-Tool zur Gesundheitsorientierung und kein medizinisches Produkt. Die Ergebnisse ersetzen keine ärztliche Diagnose oder Therapie.
          </div>

          {paymentMessage && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[#F5F2EA]">
              {paymentMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6">
              <TwinEmptyState
                subtext={errorMessage}
                onRetry={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    setErrorMessage('');
                    void fetchProfile(token);
                    void fetchHistory(token);
                  }
                }}
              />
            </div>
          )}

          <h2 className="mt-8 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
            Tagesübersicht
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <DomainCard label="Schlaf" hint="Noch keine Schlafdaten erfasst." detailHref="#mein-twin" />
            <DomainCard label="Bewegung" hint="Noch keine Bewegungsdaten erfasst." detailHref="#gewohnheiten" />
            <DomainCard label="Ernährung" hint="Noch keine Ernährungsdaten erfasst." detailHref="#gewohnheiten" />
            <DomainCard label="Stress" hint="Noch keine Stressdaten erfasst." detailHref="#mein-twin" />
            <DomainCard label="Energie" hint="Noch keine Energiedaten erfasst." detailHref="#gewohnheiten" />
            <DomainCard label="Erholung" hint="Noch keine Erholungsdaten erfasst." detailHref="#mein-twin" />
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
                {loadingProfile ? 'Lade...' : profile?.premium ? 'Beta-Zugang aktiv' : 'Starter aktiv'}
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
              Aktueller Tarif: <span className="font-semibold text-[#F5F2EA]">Beta-Zugang</span>
            </div>
          )}
        </section>


        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
            {profile?.starter_calc_remaining === 0
              ? 'Starter-Limit: 1 von 1 Berechnung wurde bereits genutzt.'
              : 'Starter-Limit: Du hast genau 1 von 1 Berechnung verfügbar.'}
          </div>
        )}

        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#F5F2EA]">
            {profile?.starter_calc_remaining === 0
              ? 'Deine einmalige Starter-Berechnung wurde bereits genutzt. Für weitere Berechnungen, Verlauf und Detailquellen aktiviere den Beta-Zugang.'
              : 'Starter enthält eine einmalige Twin-Berechnung mit Basis-Empfehlungen. Für Verlauf, Detailquellen und unbegrenzte Simulationen aktiviere den Beta-Zugang.'}
          </div>
        )}

        <section id="mein-twin" className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] scroll-mt-24">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Marker-Eingabe</h2>
              <p className="mt-2 text-sm text-[#8E969F]">Aktualisiere deine Biomarker und starte eine neue Twin-Berechnung.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">Alter</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">Geschlecht</span>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                >
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">HbA1c</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.hba1c}
                  onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">CRP</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">Vitamin D</span>
                <input
                  type="number"
                  value={form.vitamin_d}
                  onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[#B7BDC4]">ApoB</span>
                <input
                  type="number"
                  value={form.apob}
                  onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreMarkers((current) => !current)}
              className="mt-4 text-sm font-semibold text-[#B7BDC4] underline hover:text-[#58D7D4]"
            >
              {showMoreMarkers ? 'Weitere Marker ausblenden' : 'Weitere Marker anzeigen (optional)'}
            </button>

            {showMoreMarkers && (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Weitere Blutwerte</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Nüchternglukose (mg/dL)</span>
                      <input
                        type="number"
                        value={form.fasting_glucose}
                        onChange={(e) => setForm({ ...form, fasting_glucose: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">HDL-Cholesterin (mg/dL)</span>
                      <input
                        type="number"
                        value={form.hdl}
                        onChange={(e) => setForm({ ...form, hdl: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Triglyceride (mg/dL)</span>
                      <input
                        type="number"
                        value={form.triglycerides}
                        onChange={(e) => setForm({ ...form, triglycerides: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Homocystein (µmol/L)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.homocysteine}
                        onChange={(e) => setForm({ ...form, homocysteine: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">TSH (mIU/L)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.tsh}
                        onChange={(e) => setForm({ ...form, tsh: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Ferritin (ng/mL)</span>
                      <input
                        type="number"
                        value={form.ferritin}
                        onChange={(e) => setForm({ ...form, ferritin: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Vitamin B12 (pg/mL)</span>
                      <input
                        type="number"
                        value={form.vitamin_b12}
                        onChange={(e) => setForm({ ...form, vitamin_b12: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Omega-3-Index (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.omega3_index}
                        onChange={(e) => setForm({ ...form, omega3_index: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Vitalwerte &amp; Sonstiges</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Ruhepuls (bpm)</span>
                      <input
                        type="number"
                        value={form.resting_heart_rate}
                        onChange={(e) => setForm({ ...form, resting_heart_rate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Blutdruck systolisch (mmHg)</span>
                      <input
                        type="number"
                        value={form.blood_pressure_systolic}
                        onChange={(e) => setForm({ ...form, blood_pressure_systolic: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Blutdruck diastolisch (mmHg)</span>
                      <input
                        type="number"
                        value={form.blood_pressure_diastolic}
                        onChange={(e) => setForm({ ...form, blood_pressure_diastolic: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Taillenumfang (cm)</span>
                      <input
                        type="number"
                        value={form.waist_circumference}
                        onChange={(e) => setForm({ ...form, waist_circumference: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Schlafdauer (h/Nacht)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.sleep_hours}
                        onChange={(e) => setForm({ ...form, sleep_hours: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-[#B7BDC4]">Griffkraft (kg)</span>
                      <input
                        type="number"
                        value={form.grip_strength}
                        onChange={(e) => setForm({ ...form, grip_strength: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-semibold text-[#F5F2EA]">Familienkontext (optional)</p>
              <p className="mt-1 text-xs text-[#8E969F]">
                Rein für die Priorisierung deiner Wellness-Empfehlungen &mdash; keine Diagnose, keine Risikoeinstufung.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#F5F2EA]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyContext.includes('herz_kreislauf')}
                    onChange={(e) =>
                      setFamilyContext((current) =>
                        e.target.checked ? [...current, 'herz_kreislauf'] : current.filter((item) => item !== 'herz_kreislauf'),
                      )
                    }
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#58D7D4]"
                  />
                  Herz-Kreislauf in der Familie
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyContext.includes('stoffwechsel')}
                    onChange={(e) =>
                      setFamilyContext((current) =>
                        e.target.checked ? [...current, 'stoffwechsel'] : current.filter((item) => item !== 'stoffwechsel'),
                      )
                    }
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#58D7D4]"
                  />
                  Stoffwechsel/Diabetes in der Familie
                </label>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading || loadingProfile || !profile || (!profile.premium && profile.starter_calc_remaining === 0)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-lg font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? 'Berechne Twin...'
                : (loadingProfile || !profile)
                  ? 'Profil wird geladen...'
                  : (!profile.premium && profile.starter_calc_remaining === 0)
                    ? 'Starter-Limit erreicht'
                    : 'Twin neu berechnen'}
            </button>

            {!loadingProfile && profile && !profile.premium && profile?.starter_calc_remaining === 1 && (
              <p className="mt-3 text-sm text-[#B7BDC4]">Hinweis: Im Starter ist genau eine Berechnung möglich.</p>
            )}

            {displayedTwin?.methodik && (
              <p className="mt-4 text-xs text-[#8E969F]">Methodik: {displayedTwin.methodik.typ} · {displayedTwin.methodik.hinweis}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Analyse</h2>
              <p className="mt-2 text-sm text-[#8E969F]">Deine aktuelle Auswertung inklusive Vergleichsszenarien.</p>

              {!displayedTwin && (
                <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-[#B7BDC4]">
                  {!profile?.premium && profile?.starter_calc_remaining === 0
                    ? 'Starter-Berechnung bereits genutzt. Aktiviere den Beta-Zugang, um hier wieder Ergebnisse und Szenarien zu sehen.'
                    : 'Starte deine erste Berechnung, um hier Ergebnisse und Szenarien zu sehen.'}
                </div>
              )}

              {displayedTwin && (
                <>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Auf einen Blick</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#F5F2EA]">
                      {displayedTwin.empfehlungen.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#58D7D4]">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {displayedTwin.familienkontext_hinweis && (
                      <p className="mt-3 text-xs text-[#8E969F]">{displayedTwin.familienkontext_hinweis}</p>
                    )}
                  </div>

                  <p className="mt-6 font-[family-name:var(--font-serif-display)] text-5xl font-semibold text-[#F5F2EA]">{displayedTwin.biologisches_alter} Jahre</p>
                  <p className="mt-2 text-[#B7BDC4]">Abweichung vom chronologischen Alter: {displayedTwin.differenz > 0 ? '+' : ''}{displayedTwin.differenz} Jahre</p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[#8E969F]">Aktuell</p>
                      <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aktuell}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[#8E969F]">Optimiert</p>
                      <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.optimiert}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <p className="text-[#8E969F]">Aggressiv</p>
                      <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aggressiv}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Empfehlungen</h3>
              <ul className="mt-4 space-y-3 text-[#F5F2EA]">
                {(displayedTwin?.empfehlungen ?? [
                  'Schließe eine Berechnung ab, um personalisierte Empfehlungen zu erhalten.',
                  'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
                  'Kontrolliere Marker regelmäßig und tracke Verbesserungen im Dashboard.',
                ]).map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Referenzdaten & Quellen</h3>
              <p className="mt-2 text-sm text-[#8E969F]">Transparente Referenzbereiche aus veröffentlichten Leitlinien und Fachquellen.</p>

              {!loadingProfile && profile && !profile.premium && (
                <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[#F5F2EA]">
                  Detailquellen sind im Beta-Zugang verfügbar.
                </p>
              )}

              {(profile?.premium && (!displayedTwin?.marker_references || displayedTwin.marker_references.length === 0)) && (
                <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
                  Referenzdaten werden nach der ersten Berechnung angezeigt.
                </p>
              )}

              {(profile?.premium && displayedTwin?.marker_references && displayedTwin.marker_references.length > 0) && (
                <div className="mt-4 space-y-3">
                  {displayedTwin.marker_references.map((ref) => (
                    <div key={ref.marker} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <p className="text-sm font-semibold text-[#F5F2EA]">
                        {ref.marker.toUpperCase()} · Zielbereich {ref.target_min ?? '-'} bis {ref.target_max ?? '-'} {ref.unit}
                      </p>
                      <p className="mt-1 text-xs text-[#B7BDC4]">Population: {ref.population_note} · Evidenz: {ref.evidence_level}</p>
                      <a href={ref.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#58D7D4] hover:underline">
                        Quelle: {ref.source_name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="verlauf" className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 scroll-mt-24">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Verlauf</h3>
              <p className="mt-2 text-sm text-[#8E969F]">Deine letzten gespeicherten Berechnungen.</p>

              {!loadingProfile && profile && !profile.premium && (
                <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[#F5F2EA]">
                  Verlaufsansicht ist im Beta-Zugang freigeschaltet.
                </p>
              )}

              {loadingHistory && profile?.premium && <p className="mt-4 text-[#8E969F]">Verlauf wird geladen...</p>}

              {!loadingHistory && profile?.premium && history.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
                  Noch keine gespeicherten Berechnungen vorhanden.
                </p>
              )}

              {!loadingHistory && profile?.premium && history.length > 0 && (
                <div className="mt-4 space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <div className="flex items-center justify-between gap-2 text-sm text-[#8E969F]">
                        <span>{new Date(item.created_at).toLocaleString('de-DE')}</span>
                        <span>{item.differenz > 0 ? '+' : ''}{item.differenz} Jahre</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">Biologisches Alter: {item.biologisches_alter} Jahre</p>
                      <p className="mt-1 text-xs text-[#8E969F]">HbA1c {item.hba1c} • CRP {item.crp} • Vitamin D {item.vitamin_d} • ApoB {item.apob}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Feedback zur Beta</h3>
              <p className="mt-2 text-sm text-[#8E969F]">
                Was war hilfreich und was sollten wir verbessern? Dein Feedback fließt direkt in die nächsten Releases.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                <label className="text-sm text-[#B7BDC4]">Bewertung (1-5)</label>
                <select
                  value={feedbackScore}
                  onChange={(e) => setFeedbackScore(Number(e.target.value))}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                >
                  <option value={5}>5 - Sehr gut</option>
                  <option value={4}>4 - Gut</option>
                  <option value={3}>3 - Okay</option>
                  <option value={2}>2 - Schwach</option>
                  <option value={1}>1 - Schlecht</option>
                </select>
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="Z. B. 'Simulation ist stark, aber ich wünsche mir mehr Erklärung zu Marker X.'"
                className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={submitFeedback}
                  disabled={sendingFeedback}
                  className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingFeedback ? 'Sende...' : 'Feedback senden'}
                </button>
                {feedbackMessage && <p className="text-sm text-[#B7BDC4]">{feedbackMessage}</p>}
              </div>
            </div>
          </div>
        </section>

        <section id="gewohnheiten" className="mt-8 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">
                Du und dein KI-Zwilling
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
                Mensch und Twin arbeiten im Takt: Du bringst deine Angaben ein — dein Twin erkennt Trends, Erinnerungen
                und mögliche Muster daraus. Keine medizinische Bewertung, nur Wellness-Orientierung.
              </p>
            </div>
            <Link
              href="/profil#datenschutz"
              className="inline-block shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#B7BDC4] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
            >
              Datenschutz, Export &amp; Löschung
            </Link>
          </div>

          <div className="mt-6">
            <DashboardDailyPlan />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
                Du
              </p>
              <DashboardCheckin />
              <DashboardGoals />
              <DashboardHabits />
            </div>

            <div className="min-w-0 space-y-6">
              <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
                Dein KI-Zwilling
              </p>
              <DashboardRecommendations />
              <DashboardTrends />
              <DashboardTwinProgress />
              <DashboardTwinMemory />
            </div>
          </div>

          <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Frag deinen Twin</h3>
            <p className="mt-2 text-sm text-[#B7BDC4]">
              Stelle deinem digitalen Zwilling Fragen zu deiner Entwicklung — er antwortet auf Basis deiner eigenen
              Daten, immer mit Quellenangabe und „Warum?&quot;.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#B7BDC4]">
              <li>„Wie lief meine Woche?&quot;</li>
              <li>„Was kann ich heute verbessern?&quot;</li>
              <li>„Welche Gewohnheit hat den größten Einfluss?&quot;</li>
            </ul>
            <Link
              href="/frag-deinen-twin"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
            >
              Twin fragen
            </Link>
          </article>
        </section>

        <section id="cgm-ernaehrung" className="mt-8 scroll-mt-24">
          <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">
            Blutzucker &amp; Ernährung
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
            Importiere echte CGM-Messwerte oder trage eine Mahlzeit manuell ein — nur echte Daten, keine
            Platzhalter.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
                CGM-Daten importieren
              </h3>
              <p className="mt-2 text-sm text-[#B7BDC4]">Lade eine echte LibreView- oder Dexcom-CSV hoch.</p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCgmUpload}
                disabled={cgmUploading}
                className="mt-4 mb-2 w-full text-sm text-[#B7BDC4] file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#F3C979] file:to-[#C9913D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0B1118]"
              />

              {cgmUploading && <p className="text-sm text-[#58D7D4]">Wird verarbeitet...</p>}
              {cgmMessage && <p className="mt-2 text-sm text-[#B7BDC4]">{cgmMessage}</p>}

              {cgmData.length > 0 && (
                <div className="mt-6 max-h-64 space-y-1 overflow-y-auto">
                  <p className="mb-2 text-xs text-[#8E969F]">{cgmData.length} Messwerte (letzte 7 Tage)</p>
                  {cgmData.slice(0, 12).map((r, i) => (
                    <div key={i} className="flex justify-between border-b border-white/10 py-1 text-sm">
                      <span className="text-[#B7BDC4]">{new Date(r.timestamp).toLocaleString('de-DE')}</span>
                      <span className="font-medium text-[#58D7D4]">{r.glucose_value} mg/dL</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
                Ernährung eintragen
              </h3>

              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Mahlzeit (z. B. Haferflocken mit Beeren)"
                  value={nutritionForm.meal_name}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, meal_name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Kohlenhydrate (g)"
                    value={nutritionForm.carbs}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, carbs: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                  />
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={nutritionForm.protein}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                  />
                  <input
                    type="number"
                    placeholder="Fett (g)"
                    value={nutritionForm.fat}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                  />
                  <input
                    type="number"
                    placeholder="Kalorien"
                    value={nutritionForm.calories}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, calories: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                  />
                </div>

                <button
                  onClick={saveNutrition}
                  className="w-full rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
                >
                  Mahlzeit speichern
                </button>
                {nutritionMessage && <p className="text-sm text-[#B7BDC4]">{nutritionMessage}</p>}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Fortschritt</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-[#8E969F]">Berechnungen diese Woche</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{progressCounts.week}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-[#8E969F]">Berechnungen diesen Monat</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">{progressCounts.month}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-[#8E969F]">Zielerreichung</p>
              <p className="mt-2 text-2xl font-bold text-[#F5F2EA]">Noch kein Ziel gesetzt</p>
            </article>
          </div>
          <Link href="#verlauf" className="mt-4 inline-block text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            Zum vollständigen Verlauf
          </Link>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-[#8E969F]">
          <p>VitalTwin DE Dashboard</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/preise" className="transition hover:text-[#58D7D4]">Preise</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">KI-Hinweise</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}