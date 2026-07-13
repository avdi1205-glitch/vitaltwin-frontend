'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function PasswortZuruecksetzen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(apiUrl('/api/users/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? 'Passwort konnte nicht aktualisiert werden.');
        return;
      }

      router.push('/?auth=login&reset=1');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-10">
        <h1 className="text-center text-3xl font-bold text-white">Passwort zurücksetzen</h1>
        <p className="mt-3 text-center text-slate-400">
          Gib deine E-Mail und ein neues Passwort ein. Für bestehende Alt-Accounts ist das der schnellste Weg zurück in dein Konto.
        </p>

        <form onSubmit={handleReset} className="mt-8 space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Neues Passwort"
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
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
            className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white disabled:opacity-70"
          >
            {loading ? 'Aktualisiere...' : 'Passwort aktualisieren'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Zurück zum <Link href="/?auth=login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
