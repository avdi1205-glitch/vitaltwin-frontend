'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type TwinResult = {
  biologisches_alter: number;
  differenz: number;
};

export default function Dashboard() {
  const [form, setForm] = useState({
    age: 42,
    gender: "männlich",
    hba1c: 5.4,
    crp: 0.8,
    vitamin_d: 55,
    apob: 65
  });
  const [twin, setTwin] = useState<TwinResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const calculate = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.detail ?? 'Berechnung fehlgeschlagen');
        return;
      }

      setTwin(data as TwinResult);
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte pruefe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">Dein Digital Twin</h1>

      <div className="bg-slate-900 p-8 rounded-3xl mb-8">
        <h2 className="text-2xl mb-6">Deine Werte eingeben</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1">Alter</label>
            <input type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl" />
          </div>
          <div>
            <label className="block mb-1">Geschlecht</label>
            <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full p-3 bg-slate-800 rounded-xl">
              <option value="männlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">HbA1c</label>
            <input type="number" step="0.1" value={form.hba1c} onChange={(e) => setForm({...form, hba1c: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl" />
          </div>
          <div>
            <label className="block mb-1">CRP (Entzündung)</label>
            <input type="number" step="0.1" value={form.crp} onChange={(e) => setForm({...form, crp: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl" />
          </div>
          <div>
            <label className="block mb-1">Vitamin D</label>
            <input type="number" value={form.vitamin_d} onChange={(e) => setForm({...form, vitamin_d: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl" />
          </div>
          <div>
            <label className="block mb-1">ApoB</label>
            <input type="number" value={form.apob} onChange={(e) => setForm({...form, apob: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl" />
          </div>
        </div>

        <button onClick={calculate} disabled={loading} className="mt-8 w-full bg-blue-600 py-4 rounded-2xl text-lg font-semibold">
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
        </div>
      )}
    </div>
  );
}