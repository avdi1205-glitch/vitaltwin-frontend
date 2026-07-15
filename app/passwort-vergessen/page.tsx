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
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE1] px-6">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white shadow-sm p-10">
        <h1 className="text-center text-3xl font-bold text-neutral-900">Passwort vergessen</h1>
        <p className="mt-3 text-center text-neutral-500">
          Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 p-4 text-neutral-900"
            required
          />

          {message && (
            <div className="rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-70"
          >
            {loading ? 'Sende...' : 'Reset-Link anfordern'}
          </button>
        </form>

        <p className="mt-6 text-center text-neutral-500">
          Zurück zum <Link href="/?auth=login" className="text-neutral-900 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
