'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import DashboardNav from '../components/dashboard-nav';
import DashboardHabits from '../components/dashboard-habits';
import { DomainCard, TodayActionsCard } from '../components/dashboard-cards';

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

  return (
    <div className="min-h-screen bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <DashboardNav />
        <header className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">VitalTwin Intelligence</p>
              <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-5xl">
                {getGreeting()}{profile?.full_name ? `, ${profile.full_name}` : ''}
              </h1>
              <p className="mt-3 text-neutral-700">Hier ist dein heutiger VitalTwin-Überblick.</p>
            </div>


            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1 text-sm font-semibold ${profile?.premium ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-700'}`}>
                Plan: {loadingProfile ? 'Lädt...' : !profile ? 'Unbekannt' : profile.premium ? 'Beta-Zugang' : 'Starter'}
              </span>
              {!loadingProfile && profile && !profile.premium && (
                <button
                  onClick={() => router.push('/preise')}
                  className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Beta freischalten
                </button>
              )}
              <button
                onClick={() => router.push('/passwort-zuruecksetzen')}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900"
              >
                Passwort ändern
              </button>
              <button
                onClick={logout}
                className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <section id="uebersicht" className="scroll-mt-24">
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-700">
            Dieses Dashboard ist ein Wellness-Tool zur Gesundheitsorientierung und kein medizinisches Produkt. Die Ergebnisse ersetzen keine ärztliche Diagnose oder Therapie.
          </div>

          {paymentMessage && (
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-neutral-900">
              {paymentMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              {errorMessage}
            </div>
          )}

          <h2 className="mt-8 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">
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

          <h2 className="mt-10 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">
            VitalTwin-Gesamtstatus
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Dein Status basiert ausschließlich auf den Biomarkern, die du im Bereich „Mein Twin&quot; einträgst. Es handelt
            sich um keine medizinische Risikobewertung und keine wissenschaftlich exakte Messung, sondern um eine grobe
            Wellness-Orientierung.
          </p>
          <section className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Status</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">
                {loadingProfile ? 'Lade...' : profile?.premium ? 'Beta-Zugang aktiv' : 'Starter aktiv'}
              </p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Biologisches Alter</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{displayedTwin ? `${displayedTwin.biologisches_alter} Jahre` : 'Noch keine Berechnung'}</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Differenz</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">
                {displayedTwin ? `${displayedTwin.differenz > 0 ? '+' : ''}${displayedTwin.differenz} Jahre` : '-'}
              </p>
            </article>
          </section>
          <p className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600">
            Diese Schätzung dient ausschließlich der Wellness-Orientierung und ist keine medizinische Bewertung.
            Einfließende Daten: Alter, Geschlecht, HbA1c, CRP, Vitamin D, ApoB und die weiteren von dir eingetragenen
            Marker.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <TodayActionsCard title="Heute für dich" actions={displayedTwin?.empfehlungen ?? []} />

            <article className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">Frag deinen Twin</h3>
              <p className="mt-2 text-sm text-neutral-600">Stelle deinem digitalen Zwilling Fragen zu deiner Entwicklung.</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                <li>„Wie lief meine Woche?&quot;</li>
                <li>„Was kann ich heute verbessern?&quot;</li>
                <li>„Welche Gewohnheit hat den größten Einfluss?&quot;</li>
              </ul>
              <Link
                href="/frag-deinen-twin"
                className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Twin fragen
              </Link>
            </article>
          </div>

          {!loadingProfile && profile && !profile.premium && (
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
              Du nutzt aktuell Free.{' '}
              <Link href="/preise" className="font-semibold text-neutral-900 underline hover:text-black">
                Mehr Möglichkeiten mit Premium ansehen
              </Link>
              .
            </div>
          )}
          {!loadingProfile && profile?.premium && (
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
              Aktueller Tarif: <span className="font-semibold text-neutral-900">Beta-Zugang</span>
            </div>
          )}
        </section>


        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">
            {profile?.starter_calc_remaining === 0
              ? 'Starter-Limit: 1 von 1 Berechnung wurde bereits genutzt.'
              : 'Starter-Limit: Du hast genau 1 von 1 Berechnung verfügbar.'}
          </div>
        )}

        {!loadingProfile && profile && !profile.premium && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-800">
            {profile?.starter_calc_remaining === 0
              ? 'Deine einmalige Starter-Berechnung wurde bereits genutzt. Für weitere Berechnungen, Verlauf und Detailquellen aktiviere den Beta-Zugang.'
              : 'Starter enthält eine einmalige Twin-Berechnung mit Basis-Empfehlungen. Für Verlauf, Detailquellen und unbegrenzte Simulationen aktiviere den Beta-Zugang.'}
          </div>
        )}

        <section id="mein-twin" className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] scroll-mt-24">
          <div className="rounded-3xl border border-neutral-200 bg-white p-7">
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900">Marker-Eingabe</h2>
              <p className="mt-2 text-sm text-neutral-500">Aktualisiere deine Biomarker und starte eine neue Twin-Berechnung.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">Alter</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">Geschlecht</span>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">HbA1c</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.hba1c}
                  onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">CRP</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">Vitamin D</span>
                <input
                  type="number"
                  value={form.vitamin_d}
                  onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-neutral-700">ApoB</span>
                <input
                  type="number"
                  value={form.apob}
                  onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreMarkers((current) => !current)}
              className="mt-4 text-sm font-semibold text-neutral-700 underline hover:text-black"
            >
              {showMoreMarkers ? 'Weitere Marker ausblenden' : 'Weitere Marker anzeigen (optional)'}
            </button>

            {showMoreMarkers && (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Weitere Blutwerte</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Nüchternglukose (mg/dL)</span>
                      <input
                        type="number"
                        value={form.fasting_glucose}
                        onChange={(e) => setForm({ ...form, fasting_glucose: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">HDL-Cholesterin (mg/dL)</span>
                      <input
                        type="number"
                        value={form.hdl}
                        onChange={(e) => setForm({ ...form, hdl: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Triglyceride (mg/dL)</span>
                      <input
                        type="number"
                        value={form.triglycerides}
                        onChange={(e) => setForm({ ...form, triglycerides: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Homocystein (µmol/L)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.homocysteine}
                        onChange={(e) => setForm({ ...form, homocysteine: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">TSH (mIU/L)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.tsh}
                        onChange={(e) => setForm({ ...form, tsh: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Ferritin (ng/mL)</span>
                      <input
                        type="number"
                        value={form.ferritin}
                        onChange={(e) => setForm({ ...form, ferritin: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Vitamin B12 (pg/mL)</span>
                      <input
                        type="number"
                        value={form.vitamin_b12}
                        onChange={(e) => setForm({ ...form, vitamin_b12: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Omega-3-Index (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.omega3_index}
                        onChange={(e) => setForm({ ...form, omega3_index: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Vitalwerte &amp; Sonstiges</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Ruhepuls (bpm)</span>
                      <input
                        type="number"
                        value={form.resting_heart_rate}
                        onChange={(e) => setForm({ ...form, resting_heart_rate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Blutdruck systolisch (mmHg)</span>
                      <input
                        type="number"
                        value={form.blood_pressure_systolic}
                        onChange={(e) => setForm({ ...form, blood_pressure_systolic: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Blutdruck diastolisch (mmHg)</span>
                      <input
                        type="number"
                        value={form.blood_pressure_diastolic}
                        onChange={(e) => setForm({ ...form, blood_pressure_diastolic: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Taillenumfang (cm)</span>
                      <input
                        type="number"
                        value={form.waist_circumference}
                        onChange={(e) => setForm({ ...form, waist_circumference: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Schlafdauer (h/Nacht)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={form.sleep_hours}
                        onChange={(e) => setForm({ ...form, sleep_hours: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-neutral-700">Griffkraft (kg)</span>
                      <input
                        type="number"
                        value={form.grip_strength}
                        onChange={(e) => setForm({ ...form, grip_strength: Number(e.target.value) })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-neutral-200 bg-[#F5EFE1] p-4">
              <p className="text-sm font-semibold text-neutral-800">Familienkontext (optional)</p>
              <p className="mt-1 text-xs text-neutral-500">
                Rein für die Priorisierung deiner Wellness-Empfehlungen &mdash; keine Diagnose, keine Risikoeinstufung.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-800">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyContext.includes('herz_kreislauf')}
                    onChange={(e) =>
                      setFamilyContext((current) =>
                        e.target.checked ? [...current, 'herz_kreislauf'] : current.filter((item) => item !== 'herz_kreislauf'),
                      )
                    }
                    className="h-4 w-4 rounded border-neutral-300 bg-white accent-black"
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
                    className="h-4 w-4 rounded border-neutral-300 bg-white accent-black"
                  />
                  Stoffwechsel/Diabetes in der Familie
                </label>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading || loadingProfile || !profile || (!profile.premium && profile.starter_calc_remaining === 0)}
              className="mt-6 w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
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
              <p className="mt-3 text-sm text-neutral-600">Hinweis: Im Starter ist genau eine Berechnung möglich.</p>
            )}

            {displayedTwin?.methodik && (
              <p className="mt-4 text-xs text-neutral-500">Methodik: {displayedTwin.methodik.typ} · {displayedTwin.methodik.hinweis}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-7">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900">Analyse</h2>
              <p className="mt-2 text-sm text-neutral-500">Deine aktuelle Auswertung inklusive Vergleichsszenarien.</p>

              {!displayedTwin && (
                <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-[#F5EFE1] p-6 text-neutral-600">
                  {!profile?.premium && profile?.starter_calc_remaining === 0
                    ? 'Starter-Berechnung bereits genutzt. Aktiviere den Beta-Zugang, um hier wieder Ergebnisse und Szenarien zu sehen.'
                    : 'Starte deine erste Berechnung, um hier Ergebnisse und Szenarien zu sehen.'}
                </div>
              )}

              {displayedTwin && (
                <>
                  <div className="mt-6 rounded-2xl border border-neutral-200 bg-[#F5EFE1] p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Auf einen Blick</p>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-800">
                      {displayedTwin.empfehlungen.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-neutral-900">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {displayedTwin.familienkontext_hinweis && (
                      <p className="mt-3 text-xs text-neutral-500">{displayedTwin.familienkontext_hinweis}</p>
                    )}
                  </div>

                  <p className="mt-6 font-[family-name:var(--font-serif-display)] text-5xl font-semibold text-neutral-900">{displayedTwin.biologisches_alter} Jahre</p>
                  <p className="mt-2 text-neutral-700">Abweichung vom chronologischen Alter: {displayedTwin.differenz > 0 ? '+' : ''}{displayedTwin.differenz} Jahre</p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-neutral-200 bg-[#F5EFE1] p-3">
                      <p className="text-neutral-500">Aktuell</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{displayedTwin.scenarios.aktuell}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-[#F5EFE1] p-3">
                      <p className="text-neutral-500">Optimiert</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{displayedTwin.scenarios.optimiert}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-[#F5EFE1] p-3">
                      <p className="text-neutral-500">Aggressiv</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{displayedTwin.scenarios.aggressiv}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-7">
              <h3 className="text-xl font-semibold text-neutral-900">Empfehlungen</h3>
              <ul className="mt-4 space-y-3 text-neutral-800">
                {(displayedTwin?.empfehlungen ?? [
                  'Schließe eine Berechnung ab, um personalisierte Empfehlungen zu erhalten.',
                  'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
                  'Kontrolliere Marker regelmäßig und tracke Verbesserungen im Dashboard.',
                ]).map((item) => (
                  <li key={item} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-7">
              <h3 className="text-xl font-semibold text-neutral-900">Referenzdaten & Quellen</h3>
              <p className="mt-2 text-sm text-neutral-500">Transparente Referenzbereiche aus veröffentlichten Leitlinien und Fachquellen.</p>

              {!loadingProfile && profile && !profile.premium && (
                <p className="mt-4 rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-neutral-800">
                  Detailquellen sind im Beta-Zugang verfügbar.
                </p>
              )}

              {(profile?.premium && (!displayedTwin?.marker_references || displayedTwin.marker_references.length === 0)) && (
                <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-[#F5EFE1] px-4 py-3 text-neutral-500">
                  Referenzdaten werden nach der ersten Berechnung angezeigt.
                </p>
              )}

              {(profile?.premium && displayedTwin?.marker_references && displayedTwin.marker_references.length > 0) && (
                <div className="mt-4 space-y-3">
                  {displayedTwin.marker_references.map((ref) => (
                    <div key={ref.marker} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                      <p className="text-sm font-semibold text-neutral-900">
                        {ref.marker.toUpperCase()} · Zielbereich {ref.target_min ?? '-'} bis {ref.target_max ?? '-'} {ref.unit}
                      </p>
                      <p className="mt-1 text-xs text-neutral-700">Population: {ref.population_note} · Evidenz: {ref.evidence_level}</p>
                      <a href={ref.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-neutral-900 hover:underline">
                        Quelle: {ref.source_name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="verlauf" className="rounded-3xl border border-neutral-200 bg-white p-7 scroll-mt-24">
              <h3 className="text-xl font-semibold text-neutral-900">Verlauf</h3>
              <p className="mt-2 text-sm text-neutral-500">Deine letzten gespeicherten Berechnungen.</p>

              {!loadingProfile && profile && !profile.premium && (
                <p className="mt-4 rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-neutral-800">
                  Verlaufsansicht ist im Beta-Zugang freigeschaltet.
                </p>
              )}

              {loadingHistory && profile?.premium && <p className="mt-4 text-neutral-500">Verlauf wird geladen...</p>}

              {!loadingHistory && profile?.premium && history.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-[#F5EFE1] px-4 py-3 text-neutral-500">
                  Noch keine gespeicherten Berechnungen vorhanden.
                </p>
              )}

              {!loadingHistory && profile?.premium && history.length > 0 && (
                <div className="mt-4 space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3">
                      <div className="flex items-center justify-between gap-2 text-sm text-neutral-500">
                        <span>{new Date(item.created_at).toLocaleString('de-DE')}</span>
                        <span>{item.differenz > 0 ? '+' : ''}{item.differenz} Jahre</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">Biologisches Alter: {item.biologisches_alter} Jahre</p>
                      <p className="mt-1 text-xs text-neutral-500">HbA1c {item.hba1c} • CRP {item.crp} • Vitamin D {item.vitamin_d} • ApoB {item.apob}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-7">
              <h3 className="text-xl font-semibold text-neutral-900">Feedback zur Beta</h3>
              <p className="mt-2 text-sm text-neutral-500">
                Was war hilfreich und was sollten wir verbessern? Dein Feedback fließt direkt in die nächsten Releases.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                <label className="text-sm text-neutral-700">Bewertung (1-5)</label>
                <select
                  value={feedbackScore}
                  onChange={(e) => setFeedbackScore(Number(e.target.value))}
                  className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 focus:border-neutral-900 focus:outline-none"
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
                className="mt-4 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={submitFeedback}
                  disabled={sendingFeedback}
                  className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingFeedback ? 'Sende...' : 'Feedback senden'}
                </button>
                {feedbackMessage && <p className="text-sm text-neutral-700">{feedbackMessage}</p>}
              </div>
            </div>
          </div>
        </section>

        <section id="gewohnheiten" className="mt-8 scroll-mt-24">
          <DashboardHabits storageKey={profile?.email ?? 'anon'} />
        </section>

        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">Fortschritt</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Berechnungen diese Woche</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{progressCounts.week}</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Berechnungen diesen Monat</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{progressCounts.month}</p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Zielerreichung</p>
              <p className="mt-2 text-2xl font-bold text-neutral-900">Noch kein Ziel gesetzt</p>
            </article>
          </div>
          <Link href="#verlauf" className="mt-4 inline-block text-sm font-semibold text-neutral-900 underline hover:text-black">
            Zum vollständigen Verlauf
          </Link>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
          <p>VitalTwin DE Dashboard</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/preise" className="transition hover:text-black">Preise</Link>
            <Link href="/impressum" className="transition hover:text-black">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-black">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-black">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-black">Widerrufsrecht</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}