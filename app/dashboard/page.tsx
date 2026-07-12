'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const calculate = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:8000/api/twin/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setTwin(data);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-950 min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-8">Dein Digital Twin</h1>

      <div className="bg-slate-900 p-8 rounded-3xl mb-8">
        <h2 className="text-2xl mb-6">Deine Werte</h2>
        <div className="grid grid-cols-2 gap-6">
          <div><label>Alter</label><input type="number" value={form.age} onChange={(e) => setForm({...form, age: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" /></div>
          <div><label>Geschlecht</label><select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full p-3 bg-slate-800 rounded-xl mt-1"><option value="männlich">Männlich</option><option value="weiblich">Weiblich</option></select></div>
          <div><label>HbA1c</label><input type="number" step="0.1" value={form.hba1c} onChange={(e) => setForm({...form, hba1c: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" /></div>
          <div><label>CRP</label><input type="number" step="0.1" value={form.crp} onChange={(e) => setForm({...form, crp: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" /></div>
          <div><label>Vitamin D</label><input type="number" value={form.vitamin_d} onChange={(e) => setForm({...form, vitamin_d: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" /></div>
          <div><label>ApoB</label><input type="number" value={form.apob} onChange={(e) => setForm({...form, apob: Number(e.target.value)})} className="w-full p-3 bg-slate-800 rounded-xl mt-1" /></div>
        </div>
        <button onClick={calculate} disabled={loading} className="mt-8 w-full bg-blue-600 py-4 rounded-2xl text-lg">{loading ? 'Berechne...' : 'Twin berechnen'}</button>
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