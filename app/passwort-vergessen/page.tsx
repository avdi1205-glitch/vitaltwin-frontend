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
    <div className="min-h-screen flex items-center justify-center bg-[#0B1118] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-10">
        <h1 className="text-center text-3xl font-bold text-[#F5F2EA]">Passwort vergessen</h1>
        <p className="mt-3 text-center text-[#8E969F]">
          Gib deine E-Mail ein. Wenn ein Konto existiert, senden wir dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-Mail"
            className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
            required
          />

          {message && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-lg font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
          >
            {loading ? 'Sende...' : 'Reset-Link anfordern'}
          </button>
        </form>

        <p className="mt-6 text-center text-[#8E969F]">
          Zurück zum <Link href="/?auth=login" className="text-[#58D7D4] hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
