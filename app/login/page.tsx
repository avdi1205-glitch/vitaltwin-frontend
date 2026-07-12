'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('http://localhost:8000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } else {
      alert('Login fehlgeschlagen');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl w-full max-w-md border border-white/10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Willkommen zurück</h1>
          <p className="text-slate-400">Melde dich an, um deinen Twin zu sehen</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full p-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full p-4 bg-slate-800 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-2xl font-semibold text-lg text-white disabled:opacity-70 hover:bg-blue-500 transition"
          >
            {loading ? 'Anmelden...' : 'Jetzt anmelden'}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          Noch kein Konto? <a href="/register" className="text-blue-400 hover:underline">Registrieren</a>
        </p>
      </div>
    </div>
  );
}