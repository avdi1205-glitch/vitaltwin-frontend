'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
  empfehlungen: string[];
};

type ProfileResponse = {
  email: string;
  full_name?: string | null;
  premium: boolean;
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
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
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
          router.push('/login');
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const profileTimer = window.setTimeout(() => {
      void fetchProfile(token);
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
      }, 1800);
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
  }, [fetchProfile, router]);

  const calculate = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = (await res.json().catch(() => null)) as TwinResponse | { detail?: string } | null;

      if (!res.ok) {
        setErrorMessage(data && 'detail' in data ? data.detail ?? 'Berechnung fehlgeschlagen.' : 'Berechnung fehlgeschlagen.');
        return;
      }

      setTwin(data as TwinResponse);
    } catch {
      setErrorMessage('Berechnung aktuell nicht verfuegbar. Bitte pruefe die API-Verbindung.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <header className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl shadow-black/30 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/90">VitalTwin Intelligence</p>
              <h1 className="mt-2 text-3xl font-bold md:text-5xl">Dein Gesundheits-Cockpit</h1>
              <p className="mt-3 text-slate-300">
                Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}. Fuehre neue Berechnungen aus und optimiere deinen Twin Schritt fuer Schritt.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1 text-sm font-semibold ${profile?.premium ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/30' : 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/30'}`}>
                Plan: {profile?.premium ? 'Premium' : 'Starter'}
              </span>
              {!profile?.premium && (
                <button
                  onClick={() => router.push('/preise')}
                  className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Upgrade
                </button>
              )}
              <button
                onClick={logout}
                className="rounded-full border border-red-400/50 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

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
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {loadingProfile ? 'Lade...' : profile?.premium ? 'Premium aktiv' : 'Starter aktiv'}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Biologisches Alter</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">{twin ? `${twin.biologisches_alter} Jahre` : 'Noch keine Berechnung'}</p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">Differenz</p>
            <p className={`mt-2 text-2xl font-bold ${twin && twin.differenz <= 0 ? 'text-emerald-300' : 'text-amber-200'}`}>
              {twin ? `${twin.differenz > 0 ? '+' : ''}${twin.differenz} Jahre` : '-'}
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Marker-Eingabe</h2>
              <p className="mt-2 text-sm text-slate-400">Aktualisiere deine Biomarker und starte eine neue Twin-Berechnung.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Alter</span>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Geschlecht</span>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="männlich">Männlich</option>
                  <option value="weiblich">Weiblich</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">HbA1c</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.hba1c}
                  onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">CRP</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.crp}
                  onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Vitamin D</span>
                <input
                  type="number"
                  value={form.vitamin_d}
                  onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">ApoB</span>
                <input
                  type="number"
                  value={form.apob}
                  onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                />
              </label>
            </div>

            <button
              onClick={calculate}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-lg font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Berechne Twin...' : 'Twin neu berechnen'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
              <h2 className="text-2xl font-semibold">Analyse</h2>
              <p className="mt-2 text-sm text-slate-400">Deine aktuelle Auswertung inklusive Vergleichsszenarien.</p>

              {!twin && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400">
                  Starte deine erste Berechnung, um hier Ergebnisse und Szenarien zu sehen.
                </div>
              )}

              {twin && (
                <>
                  <p className="mt-6 text-5xl font-bold text-cyan-300">{twin.biologisches_alter} Jahre</p>
                  <p className="mt-2 text-slate-300">Abweichung vom chronologischen Alter: {twin.differenz > 0 ? '+' : ''}{twin.differenz} Jahre</p>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-slate-400">Aktuell</p>
                      <p className="mt-1 text-lg font-semibold">{twin.scenarios.aktuell}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-slate-400">Optimiert</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{twin.scenarios.optimiert}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-slate-400">Aggressiv</p>
                      <p className="mt-1 text-lg font-semibold text-cyan-300">{twin.scenarios.aggressiv}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7">
              <h3 className="text-xl font-semibold">Empfehlungen</h3>
              <ul className="mt-4 space-y-3 text-slate-200">
                {(twin?.empfehlungen ?? [
                  'Schliesse eine Berechnung ab, um personalisierte Empfehlungen zu erhalten.',
                  'Achte auf Schlaf, Stressmanagement und regelmaessige Bewegung.',
                  'Kontrolliere Marker regelmaessig und tracke Verbesserungen im Dashboard.',
                ]).map((item) => (
                  <li key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-sm text-slate-400">
          <p>VitalTwin DE Dashboard</p>
          <div className="flex items-center gap-5">
            <Link href="/preise" className="transition hover:text-cyan-300">Preise</Link>
            <Link href="/impressum" className="transition hover:text-cyan-300">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-cyan-300">Datenschutz</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}