'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiUrl } from '@/lib/api';

export default function PasswortVergessen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/users/request-password-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);
      setMessage(
        data?.message ??
          'Falls ein Konto mit dieser E-Mail existiert, haben wir eine E-Mail zum Zurücksetzen des Passworts gesendet.',
      );
    } catch {
      setMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-10">
        <h1 className="text-center text-3xl font-bold text-white">Passwort vergessen</h1>
        <p className="mt-3 text-center text-slate-400">
          Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
            required
          />

          {message && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white disabled:opacity-70"
          >
            {loading ? 'Sende...' : 'Reset-Link anfordern'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Zurück zum <Link href="/?auth=login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
