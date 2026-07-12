'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type TwinForm = {
  age: number;
  gender: 'maennlich' | 'weiblich' | 'divers';
  hba1c: number;
  crp: number;
  vitamin_d: number;
  apob: number;
};

type TwinResponse = {
  biologisches_alter: number;
  differenz: number;
  health_score?: number;
  scenarios: Record<string, number>;
  empfehlungen: string[];
};

export default function Dashboard() {
  const [form, setForm] = useState<TwinForm>({
    age: 42,
    gender: 'maennlich',
    hba1c: 5.4,
    crp: 0.8,
    vitamin_d: 45,
    apob: 75,
  });
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const calculate = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.detail ?? 'Berechnung fehlgeschlagen. Bitte Eingaben pruefen.');
        return;
      }

      setTwin(data as TwinResponse);
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">Dein Digital Twin</h1>

      <div className="bg-slate-900 p-8 rounded-3xl mb-8">
        <h2 className="text-2xl mb-6">Deine Werte</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label>Alter</label>
            <input type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" />
          </div>
          <div>
            <label>Geschlecht</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as TwinForm['gender'] })}
              className="w-full p-3 bg-slate-800 rounded-xl mt-1"
            >
              <option value="maennlich">Maennlich</option>
              <option value="weiblich">Weiblich</option>
              <option value="divers">Divers</option>
            </select>
          </div>
          <div>
            <label>HbA1c</label>
            <input type="number" step="0.1" value={form.hba1c} onChange={(e) => setForm({...form, hba1c: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" />
          </div>
          <div>
            <label>CRP</label>
            <input type="number" step="0.1" value={form.crp} onChange={(e) => setForm({...form, crp: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" />
          </div>
          <div>
            <label>Vitamin D</label>
            <input type="number" value={form.vitamin_d} onChange={(e) => setForm({...form, vitamin_d: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" />
          </div>
          <div>
            <label>ApoB</label>
            <input type="number" value={form.apob} onChange={(e) => setForm({...form, apob: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" />
          </div>
        </div>

        <button onClick={calculate} disabled={loading} className="mt-8 w-full bg-blue-600 py-4 rounded-2xl text-lg">
          {loading ? 'Berechne...' : 'Twin berechnen'}
        </button>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
      </div>

      {twin && (
        <div className="bg-slate-900 p-8 rounded-3xl">
          <h2 className="text-3xl mb-6">Dein Ergebnis</h2>
          <p className="text-6xl font-bold text-blue-400">{twin.biologisches_alter} Jahre</p>
          <p className="text-xl mt-4">Differenz: {twin.differenz} Jahre</p>

          {typeof twin.health_score === 'number' && (
            <p className="text-lg mt-2 text-emerald-300">Health Score: {twin.health_score} / 100</p>
          )}

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {Object.entries(twin.scenarios || {}).map(([key, value]) => (
              <div key={key} className="rounded-2xl bg-slate-800 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-400">{key}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-800/70 p-5">
            <h3 className="text-xl font-semibold mb-3">Empfehlungen</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-200">
              {twin.empfehlungen?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}