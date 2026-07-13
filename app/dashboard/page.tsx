'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type TwinResult = {
  biologisches_alter: number;
  differenz: number;
  scenarios?: Record<string, number>;
  empfehlungen?: string[];
};

type TwinForm = {
  age: number;
  gender: string;
  hba1c: number;
  crp: number;
  vitamin_d: number;
  apob: number;
};

type HistoryEntry = {
  id: string;
  createdAt: string;
  chronoAge: number;
  biologicalAge: number;
  difference: number;
};

const HISTORY_KEY = 'vitaltwin-history-v1';

export default function Dashboard() {
  const [form, setForm] = useState<TwinForm>({
    age: 47,
    gender: 'männlich',
    hba1c: 5.8,
    crp: 0.9,
    vitamin_d: 35,
    apob: 70,
  });
  const [twin, setTwin] = useState<TwinResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as HistoryEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const updateForm = (patch: Partial<TwinForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const calculate = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as TwinResult & { detail?: string };

      if (!res.ok || !data) {
        setErrorMessage(data?.detail ?? 'Berechnung fehlgeschlagen');
        return;
      }

      const result: TwinResult = {
        biologisches_alter: data.biologisches_alter,
        differenz: data.differenz,
        scenarios: data.scenarios,
        empfehlungen: data.empfehlungen,
      };

      setTwin(result);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        chronoAge: form.age,
        biologicalAge: result.biologisches_alter,
        difference: result.differenz,
      };

      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte pruefe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  const strengths = [
    form.hba1c <= 5.7 ? 'Guter HbA1c-Wert' : null,
    form.crp <= 1.0 ? 'Niedrige Entzuendung' : null,
    form.apob <= 80 ? 'ApoB im soliden Bereich' : null,
  ].filter(Boolean) as string[];

  const improvements = [
    form.vitamin_d < 40 ? 'Vitamin D optimieren' : null,
    form.apob > 70 ? 'ApoB weiter senken' : null,
    form.crp > 1.0 ? 'Entzuendung reduzieren' : null,
  ].filter(Boolean) as string[];

  const chartData = history.slice(0, 8).reverse();
  const chartValues = chartData.flatMap((item) => [item.chronoAge, item.biologicalAge]);
  const minY = chartValues.length ? Math.min(...chartValues) : 0;
  const maxY = chartValues.length ? Math.max(...chartValues) : 1;
  const yRange = Math.max(1, maxY - minY);

  const getX = (index: number) => {
    if (chartData.length <= 1) {
      return 50;
    }
    return (index / (chartData.length - 1)) * 100;
  };

  const getY = (value: number) => 100 - ((value - minY) / yRange) * 100;

  const bioPoints = chartData
    .map((item, index) => `${getX(index)},${getY(item.biologicalAge)}`)
    .join(' ');
  const chronoPoints = chartData
    .map((item, index) => `${getX(index)},${getY(item.chronoAge)}`)
    .join(' ');

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold">VT</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">vitaltwin</h1>
              <p className="-mt-1 text-sm text-zinc-400">Dein Digitaler Zwilling</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <button className="transition-colors hover:text-blue-400">Dashboard</button>
            <button className="transition-colors hover:text-blue-400">Historie</button>
            <button className="transition-colors hover:text-blue-400">Empfehlungen</button>
            <button className="transition-colors hover:text-blue-400">Profil</button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">👤</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <h2 className="mb-6 text-2xl font-semibold">Deine Werte eingeben</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Alter</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => updateForm({ age: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Geschlecht</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm({ gender: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="männlich">Männlich</option>
                    <option value="weiblich">Weiblich</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.hba1c}
                    onChange={(e) => updateForm({ hba1c: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">CRP (Entzündung)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.crp}
                    onChange={(e) => updateForm({ crp: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">Vitamin D (ng/ml)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.vitamin_d}
                    onChange={(e) => updateForm({ vitamin_d: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-400">ApoB (mg/dl)</label>
                  <input
                    type="number"
                    value={form.apob}
                    onChange={(e) => updateForm({ apob: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <button
                onClick={calculate}
                disabled={loading}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-5 text-lg font-medium transition-colors hover:bg-blue-500 disabled:opacity-70"
              >
                {loading ? 'Berechne...' : 'Twin berechnen'}
              </button>

              {errorMessage && (
                <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            {twin ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg text-zinc-400">Dein Ergebnis</h2>
                    <div className="mt-1 text-7xl font-bold text-blue-400">{twin.biologisches_alter.toFixed(1)}</div>
                    <div className="text-2xl text-zinc-400">Jahre biologisches Alter</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-medium ${twin.differenz > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {twin.differenz > 0 ? '+' : ''}{twin.differenz.toFixed(1)} Jahre
                    </div>
                    <div className="text-zinc-400">im Vergleich zu deinem chronologischen Alter</div>
                  </div>
                </div>

                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-900/70 p-5">
                    <div className="font-medium text-emerald-400">Stärken</div>
                    <ul className="mt-3 space-y-1 text-zinc-300">
                      {strengths.length > 0 ? strengths.map((item) => <li key={item}>• {item}</li>) : <li>• Noch keine klaren Stärken erkannt</li>}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-zinc-900/70 p-5">
                    <div className="font-medium text-amber-400">Optimierungspotenzial</div>
                    <ul className="mt-3 space-y-1 text-zinc-300">
                      {improvements.length > 0 ? improvements.map((item) => <li key={item}>• {item}</li>) : <li>• Du bist bereits in einem guten Bereich</li>}
                    </ul>
                  </div>
                </div>

                {!!twin.scenarios && (
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {Object.entries(twin.scenarios).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-center">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">{key}</p>
                        <p className="mt-2 text-3xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!!twin.empfehlungen?.length && (
                  <div className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
                    <h3 className="mb-2 text-lg font-medium">Nächste Empfehlungen</h3>
                    <ul className="space-y-2 text-zinc-300">
                      {twin.empfehlungen.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-16 text-center backdrop-blur-xl">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900 text-5xl">🧬</div>
                <h3 className="mb-2 text-2xl font-medium">Bereite deinen Digital Twin vor</h3>
                <p className="max-w-xs text-zinc-400">Gib deine Werte ein und lass den Algorithmus dein biologisches Alter berechnen.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-semibold">Verlauf</h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="rounded-lg border border-white/15 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  Leeren
                </button>
              )}
            </div>
            {history.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48 rounded-2xl bg-zinc-900 p-3">
                  <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
                    <line x1="0" y1="100" x2="100" y2="100" stroke="rgb(82 82 91)" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="0" y2="100" stroke="rgb(82 82 91)" strokeWidth="0.5" />

                    {chartData.length > 1 && (
                      <>
                        <polyline fill="none" stroke="rgb(96 165 250)" strokeWidth="1.8" points={bioPoints} />
                        <polyline fill="none" stroke="rgb(52 211 153)" strokeWidth="1.8" points={chronoPoints} />
                      </>
                    )}

                    {chartData.map((item, index) => (
                      <g key={item.id}>
                        <circle cx={getX(index)} cy={getY(item.biologicalAge)} r="1.3" fill="rgb(96 165 250)" />
                        <circle cx={getX(index)} cy={getY(item.chronoAge)} r="1.3" fill="rgb(52 211 153)" />
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="space-y-2">
                  {history.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                      <div className="flex items-center justify-between">
                        <span>{new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
                        <span className={item.difference > 0 ? 'text-red-300' : 'text-emerald-300'}>
                          {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)} Jahre
                        </span>
                      </div>
                      <div className="mt-1 text-zinc-400">
                        Bio {item.biologicalAge.toFixed(1)} • Chrono {item.chronoAge.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
                Noch keine Messungen gespeichert
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h3 className="mb-4 font-semibold">Nächste Schritte</h3>
            <div className="space-y-4 text-zinc-300">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">🥦</div>
                <div>
                  <div className="font-medium text-white">Ernährung optimieren</div>
                  <div className="text-sm text-zinc-400">Entzündung und ApoB positiv beeinflussen</div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h3 className="mb-4 font-semibold">Risikobewertung</h3>
            <div className="flex items-center gap-5">
              <div className="text-6xl font-bold text-emerald-400">82</div>
              <div>
                <div className="font-medium text-white">Vital-Score</div>
                <div className="text-sm text-emerald-400">Sehr gut • Potenzial vorhanden</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}