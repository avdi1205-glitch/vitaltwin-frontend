'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TwinResponse = {
  biologisches_alter: number;
  differenz: number;
};

export default function Dashboard() {
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const calculate = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:8000/api/twin/calculate', {
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
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">VitalTwin Dashboard</h1>
        <button onClick={() => router.push('/login')} className="text-red-400 hover:underline">Abmelden</button>
      </div>

      <button 
        onClick={calculate}
        disabled={loading}
        className="bg-blue-600 px-10 py-5 rounded-2xl text-xl mb-10 hover:bg-blue-500 disabled:opacity-70"
      >
        {loading ? 'Berechne...' : 'Digital Twin berechnen'}
      </button>

      {twin && (
        <div className="bg-slate-900 p-10 rounded-3xl">
          <h2 className="text-4xl font-bold mb-6">Dein Ergebnis</h2>
          <p className="text-7xl font-bold text-blue-400 mb-4">{twin.biologisches_alter} Jahre</p>
          <p className="text-2xl mb-8">Differenz: {twin.differenz} Jahre</p>
        </div>
      )}
    </div>
  );
}