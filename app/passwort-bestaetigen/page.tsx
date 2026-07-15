'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function PasswortBestaetigen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkChecked, setLinkChecked] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      setAccessToken(params.get('access_token'));
      setLinkChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!accessToken) {
      setErrorMessage('Reset-Link ist ungültig oder abgelaufen.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Neues Passwort muss mindestens 8 Zeichen haben.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/users/complete-password-reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, new_password: newPassword }),
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
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-900 p-10">
        <h1 className="text-center text-3xl font-bold text-white">Neues Passwort setzen</h1>

        {linkChecked && !accessToken && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Reset-Link an.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Neues Passwort (mind. 8 Zeichen)"
            className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
            required
            minLength={8}
          />

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full rounded-2xl bg-orange-600 py-4 text-lg font-semibold text-white disabled:opacity-70"
          >
            {loading ? 'Aktualisiere...' : 'Passwort speichern'}
          </button>
        </form>

        <p className="mt-6 text-center text-stone-400">
          Zurück zum <Link href="/passwort-vergessen" className="text-orange-400 hover:underline">Passwort vergessen</Link>
        </p>
      </div>
    </div>
  );
}
