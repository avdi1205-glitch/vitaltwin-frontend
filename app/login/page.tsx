'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        router.push('/dashboard');
        return;
      }

      setErrorMessage(data?.detail ?? 'Login fehlgeschlagen');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte pruefe, ob der Server auf Port 8000 laeuft.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="bg-slate-900 p-10 rounded-3xl w-full max-w-md border border-slate-800">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Anmelden</h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white"
            required
          />

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-2xl font-semibold text-lg text-white disabled:opacity-70"
          >
            {loading ? 'Anmelden...' : 'Jetzt anmelden'}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}