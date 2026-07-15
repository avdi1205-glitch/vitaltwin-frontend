'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export default function PasswortAendern() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/?auth=login');
    }
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Neues Passwort muss mindestens 8 Zeichen haben.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/users/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? 'Passwort konnte nicht aktualisiert werden.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setSuccessMessage(data?.message ?? 'Passwort erfolgreich aktualisiert.');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-900 p-10">
        <h1 className="text-center text-3xl font-bold text-white">Passwort ändern</h1>
        <p className="mt-3 text-center text-stone-400">
          Gib dein aktuelles Passwort und ein neues Passwort ein, um dein Konto-Passwort zu aktualisieren.
        </p>

        <form onSubmit={handleChangePassword} className="mt-8 space-y-6">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Aktuelles Passwort"
            className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
            required
          />
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

          {successMessage && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-orange-600 py-4 text-lg font-semibold text-white disabled:opacity-70"
          >
            {loading ? 'Aktualisiere...' : 'Passwort aktualisieren'}
          </button>
        </form>

        <p className="mt-6 text-center text-stone-400">
          Zurück zum <Link href="/dashboard" className="text-orange-400 hover:underline">Dashboard</Link>
        </p>
      </div>
    </div>
  );
}

