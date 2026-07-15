'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

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
  });
  const [familyContext, setFamilyContext] = useState<string[]>([]);
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  const fetchProfile = useCallback(async (token: string) => {
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
        return;
      }

      setProfile(data as ProfileResponse);
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte versuche es in wenigen Sekunden erneut.');
    } finally {
      setLoadingProfile(false);
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
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <header className="rounded-3xl border border-stone-800/80 bg-stone-900/60 p-6 shadow-xl shadow-black/30 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-300/90">VitalTwin Intelligence</p>
              <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-3xl font-semibold md:text-5xl">Dein Gesundheits-Cockpit</h1>
              <p className="mt-3 text-stone-300">
                Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}. Führe neue Berechnungen aus und optimiere deinen Twin Schritt für Schritt.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1 text-sm font-semibold ${profile?.premium ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/30' : 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-300/30'}`}>
                Plan: {profile?.premium ? 'Beta-Zugang' : 'Starter'}
              </span>
              {!profile?.premium && (
                <button
                  onClick={() => router.push('/preise')}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Beta freischalten
                </button>
              )}
              <button
                onClick={() => router.push('/passwort-zuruecksetzen')}
                className="rounded-full border border-stone-600 px-5 py-2 text-sm font-semibold text-stone-200 transition hover:border-amber-300/50"
              >
                Passwort ändern
              </button>
              <button
                onClick={logout}
                className="rounded-full border border-red-400/50 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Dieses Dashboard ist ein Wellness-Tool zur Gesundheitsorientierung und kein medizinisches Produkt. Die Ergebnisse ersetzen keine ärztliche Diagnose oder Therapie.
        </div>

        {paymentMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-emerald-100">
            {paymentMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-red-200">
            {errorMessage}
          </div>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
            <p className="text-sm text-stone-400">Status</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {loadingProfile ? 'Lade...' : profile?.premium ? 'Beta-Zugang aktiv' : 'Starter aktiv'}
            </p>
          </article>
          <article className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
            <p className="text-sm text-stone-400">Biologisches Alter</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{displayedTwin ? `${displayedTwin.biologisches_alter} Jahre` : 'Noch keine Berechnung'}</p>
          </article>
          <article className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
            <p className="text-sm text-stone-400">Differenz</p>
            <p className={`mt-2 text-2xl font-bold ${displayedTwin && displayedTwin.differenz <= 0 ? 'text-emerald-300' : 'text-amber-200'}`}>
              {displayedTwin ? `${displayedTwin.differenz > 0 ? '+' : ''}${displayedTwin.differenz} Jahre` : '-'}
            </p>
          </article>
        </section>

        {!loadingProfile && !profile?.premium && (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {profile?.starter_calc_remaining === 0
              ? 'Starter-Limit: 1 von 1 Berechnung wurde bereits genutzt.'
              : 'Starter-Limit: Du hast genau 1 von 1 Berechnung verfügbar.'}
          </div>
        )}

        {!loadingProfile && !profile?.premium && (
          <div className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-5 py-4 text-sm text-orange-100">
            {profile?.starter_calc_remaining === 0
              ? 'Deine einmalige Starter-Berechnung wurde bereits genutzt. Für weitere Berechnungen, Verlauf und Detailquellen aktiviere den Beta-Zugang.'
              : 'Starter enthält eine einmalige Twin-Berechnung mit Basis-Empfehlungen. Für Verlauf, Detailquellen und unbegrenzte Simulationen aktiviere den Beta-Zugang.'}
          </div>
        )}

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-white">Marker-Eingabe</h2>
              <p className="mt-2 text-sm text-stone-400">Aktualisiere deine Biomarker und starte eine neue Twin-Berechnung.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">Alter</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">Geschlecht</span>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">HbA1c</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.hba1c}
                  onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">CRP</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">Vitamin D</span>
                <input
                  type="number"
                  value={form.vitamin_d}
                  onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-stone-300">ApoB</span>
                <input
                  type="number"
                  value={form.apob}
                  onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })}
                  className="w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-stone-700 bg-stone-800/40 p-4">
              <p className="text-sm font-semibold text-stone-200">Familienkontext (optional)</p>
              <p className="mt-1 text-xs text-stone-400">
                Rein für die Priorisierung deiner Wellness-Empfehlungen &mdash; keine Diagnose, keine Risikoeinstufung.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyContext.includes('herz_kreislauf')}
                    onChange={(e) =>
                      setFamilyContext((current) =>
                        e.target.checked ? [...current, 'herz_kreislauf'] : current.filter((item) => item !== 'herz_kreislauf'),
                      )
                    }
                    className="h-4 w-4 rounded border-stone-600 bg-stone-800 accent-amber-500"
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
                    className="h-4 w-4 rounded border-stone-600 bg-stone-800 accent-amber-500"
                  />
                  Stoffwechsel/Diabetes in der Familie
                </label>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading || loadingProfile || !profile || (!profile.premium && profile.starter_calc_remaining === 0)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-4 text-lg font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? 'Berechne Twin...'
                : (loadingProfile || !profile)
                  ? 'Profil wird geladen...'
                  : (!profile.premium && profile.starter_calc_remaining === 0)
                    ? 'Starter-Limit erreicht'
                    : 'Twin neu berechnen'}
            </button>

            {!loadingProfile && !profile?.premium && profile?.starter_calc_remaining === 1 && (
              <p className="mt-3 text-sm text-amber-200">Hinweis: Im Starter ist genau eine Berechnung möglich.</p>
            )}

            {displayedTwin?.methodik && (
              <p className="mt-4 text-xs text-stone-400">Methodik: {displayedTwin.methodik.typ} · {displayedTwin.methodik.hinweis}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold">Analyse</h2>
              <p className="mt-2 text-sm text-stone-400">Deine aktuelle Auswertung inklusive Vergleichsszenarien.</p>

              {!displayedTwin && (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-700 bg-stone-950/40 p-6 text-stone-400">
                  {!profile?.premium && profile?.starter_calc_remaining === 0
                    ? 'Starter-Berechnung bereits genutzt. Aktiviere den Beta-Zugang, um hier wieder Ergebnisse und Szenarien zu sehen.'
                    : 'Starte deine erste Berechnung, um hier Ergebnisse und Szenarien zu sehen.'}
                </div>
              )}

              {displayedTwin && (
                <>
                  <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Auf einen Blick</p>
                    <ul className="mt-3 space-y-2 text-sm text-stone-200">
                      {displayedTwin.empfehlungen.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-amber-300">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {displayedTwin.familienkontext_hinweis && (
                      <p className="mt-3 text-xs text-amber-200/80">{displayedTwin.familienkontext_hinweis}</p>
                    )}
                  </div>

                  <p className="mt-6 font-[family-name:var(--font-serif-display)] text-5xl font-semibold text-amber-300">{displayedTwin.biologisches_alter} Jahre</p>
                  <p className="mt-2 text-stone-300">Abweichung vom chronologischen Alter: {displayedTwin.differenz > 0 ? '+' : ''}{displayedTwin.differenz} Jahre</p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                      <p className="text-stone-400">Aktuell</p>
                      <p className="mt-1 text-lg font-semibold">{displayedTwin.scenarios.aktuell}</p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                      <p className="text-stone-400">Optimiert</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{displayedTwin.scenarios.optimiert}</p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
                      <p className="text-stone-400">Aggressiv</p>
                      <p className="mt-1 text-lg font-semibold text-amber-300">{displayedTwin.scenarios.aggressiv}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
              <h3 className="text-xl font-semibold">Empfehlungen</h3>
              <ul className="mt-4 space-y-3 text-stone-200">
                {(displayedTwin?.empfehlungen ?? [
                  'Schließe eine Berechnung ab, um personalisierte Empfehlungen zu erhalten.',
                  'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
                  'Kontrolliere Marker regelmäßig und tracke Verbesserungen im Dashboard.',
                ]).map((item) => (
                  <li key={item} className="rounded-xl border border-stone-800 bg-stone-950/60 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
              <h3 className="text-xl font-semibold">Referenzdaten & Quellen</h3>
              <p className="mt-2 text-sm text-stone-400">Transparente Referenzbereiche aus veröffentlichten Leitlinien und Fachquellen.</p>

              {!loadingProfile && !profile?.premium && (
                <p className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-orange-100">
                  Detailquellen sind im Beta-Zugang verfügbar.
                </p>
              )}

              {(profile?.premium && (!displayedTwin?.marker_references || displayedTwin.marker_references.length === 0)) && (
                <p className="mt-4 rounded-xl border border-dashed border-stone-700 bg-stone-950/40 px-4 py-3 text-stone-400">
                  Referenzdaten werden nach der ersten Berechnung angezeigt.
                </p>
              )}

              {(profile?.premium && displayedTwin?.marker_references && displayedTwin.marker_references.length > 0) && (
                <div className="mt-4 space-y-3">
                  {displayedTwin.marker_references.map((ref) => (
                    <div key={ref.marker} className="rounded-xl border border-stone-800 bg-stone-950/60 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-300">
                        {ref.marker.toUpperCase()} · Zielbereich {ref.target_min ?? '-'} bis {ref.target_max ?? '-'} {ref.unit}
                      </p>
                      <p className="mt-1 text-xs text-stone-300">Population: {ref.population_note} · Evidenz: {ref.evidence_level}</p>
                      <a href={ref.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-orange-300 hover:underline">
                        Quelle: {ref.source_name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
              <h3 className="text-xl font-semibold">Verlauf</h3>
              <p className="mt-2 text-sm text-stone-400">Deine letzten gespeicherten Berechnungen.</p>

              {!loadingProfile && !profile?.premium && (
                <p className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-orange-100">
                  Verlaufsansicht ist im Beta-Zugang freigeschaltet.
                </p>
              )}

              {loadingHistory && profile?.premium && <p className="mt-4 text-stone-400">Verlauf wird geladen...</p>}

              {!loadingHistory && profile?.premium && history.length === 0 && (
                <p className="mt-4 rounded-xl border border-dashed border-stone-700 bg-stone-950/40 px-4 py-3 text-stone-400">
                  Noch keine gespeicherten Berechnungen vorhanden.
                </p>
              )}

              {!loadingHistory && profile?.premium && history.length > 0 && (
                <div className="mt-4 space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-stone-800 bg-stone-950/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-2 text-sm text-stone-400">
                        <span>{new Date(item.created_at).toLocaleString('de-DE')}</span>
                        <span>{item.differenz > 0 ? '+' : ''}{item.differenz} Jahre</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold text-amber-300">Biologisches Alter: {item.biologisches_alter} Jahre</p>
                      <p className="mt-1 text-xs text-stone-400">HbA1c {item.hba1c} • CRP {item.crp} • Vitamin D {item.vitamin_d} • ApoB {item.apob}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/70 p-7">
              <h3 className="text-xl font-semibold">Feedback zur Beta</h3>
              <p className="mt-2 text-sm text-stone-400">
                Was war hilfreich und was sollten wir verbessern? Dein Feedback fließt direkt in die nächsten Releases.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                <label className="text-sm text-stone-300">Bewertung (1-5)</label>
                <select
                  value={feedbackScore}
                  onChange={(e) => setFeedbackScore(Number(e.target.value))}
                  className="rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
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
                className="mt-4 w-full rounded-xl border border-stone-700 bg-stone-800/90 px-4 py-3 text-white placeholder:text-stone-500 focus:border-amber-400 focus:outline-none"
              />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={submitFeedback}
                  disabled={sendingFeedback}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingFeedback ? 'Sende...' : 'Feedback senden'}
                </button>
                {feedbackMessage && <p className="text-sm text-stone-300">{feedbackMessage}</p>}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-stone-800 pt-6 text-sm text-stone-400">
          <p>VitalTwin DE Dashboard</p>
          <div className="flex items-center gap-5">
            <Link href="/preise" className="transition hover:text-amber-300">Preise</Link>
            <Link href="/impressum" className="transition hover:text-amber-300">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-amber-300">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-amber-300">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-amber-300">Widerrufsrecht</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}