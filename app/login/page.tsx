'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

function getInitialInfoMessage() {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    return 'Konto erstellt. Du kannst dich jetzt anmelden.';
  }

  if (params.get('reset') === '1') {
    return 'Passwort aktualisiert. Bitte melde dich mit dem neuen Passwort an.';
  }

  return '';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage] = useState(getInitialInfoMessage);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(apiUrl('/api/users/login'), {
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

      setErrorMessage(data?.detail ?? data?.message ?? 'Login fehlgeschlagen');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
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

        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          Falls dein Konto noch aus der alten Version stammt, registriere dich einmal neu oder setze dein Passwort zur Sicherheit zurück.
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

          <div className="text-right text-sm">
            <Link href="/passwort-zuruecksetzen" className="text-blue-400 hover:underline">
              Passwort vergessen?
            </Link>
          </div>

          {infoMessage && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {infoMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </form>

        <p className="text-center mt-8 text-slate-400">
          Noch kein Konto? <Link href="/register" className="text-blue-400 hover:underline">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}