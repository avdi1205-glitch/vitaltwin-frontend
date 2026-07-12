'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type TwinResult = {
  biologisches_alter: number;
  differenz: number;
  scenarios?: Record<string, number | string>;
  empfehlungen?: string[];
};

export default function Dashboard() {
  const [twin, setTwin] = useState<TwinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const calculate = async () => {
    setLoading(true);
    const res = await fetch(apiUrl('/api/twin/calculate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: 42,
        gender: "männlich",
        hba1c: 5.4,
        crp: 0.8,
        vitamin_d: 55,
        apob: 65
      })
    });
    const data = await res.json();
    setTwin(data);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-slate-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-5xl font-bold">VitalTwin Dashboard</h1>
          <p className="text-slate-400 mt-2">Dein persönlicher Langlebigkeits-Zwilling</p>
        </div>
        <button 
          onClick={() => router.push('/login')} 
          className="text-red-400 hover:text-red-500 transition"
        >
          Abmelden
        </button>
      </div>

      <button 
        onClick={calculate}
        disabled={loading}
        className="bg-gradient-to-r from-blue-600 to-cyan-500 px-12 py-6 rounded-3xl text-2xl font-semibold mb-12 hover:scale-105 transition disabled:opacity-70"
      >
        {loading ? 'Berechne deinen Twin...' : 'Digital Twin berechnen'}
      </button>

      {twin && (
        <div className="bg-slate-900/80 backdrop-blur-xl p-12 rounded-3xl border border-white/10">
          <h2 className="text-4xl font-bold mb-8">Dein Ergebnis</h2>
          
          <div className="text-center mb-12">
            <p className="text-8xl font-bold text-blue-400 mb-4">{twin.biologisches_alter}</p>
            <p className="text-3xl">Jahre biologisches Alter</p>
            <p className="text-xl text-red-400 mt-4">Differenz: {twin.differenz} Jahre</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {(Object.entries(twin.scenarios || {}) as Array<[string, string | number]>).map(([key, value]) => (
              <div key={key} className="bg-slate-800 p-8 rounded-3xl text-center">
                <p className="text-sm text-slate-400 uppercase tracking-widest mb-2">{key}</p>
                <p className="text-5xl font-bold text-white">{value}</p>
                <p className="text-slate-400">Jahre</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-slate-400">
            Empfehlungen: {twin.empfehlungen?.join(" • ")}
          </div>
        </div>
      )}
    </div>
  );
}