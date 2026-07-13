'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type AuthMode = 'login' | 'register';

type HomeAuthModalProps = {
  mode: AuthMode;
  onClose: () => void;
  initialNotice?: string;
};

export default function HomeAuthModal({ mode, onClose, initialNotice = '' }: HomeAuthModalProps) {
  const [tab, setTab] = useState<AuthMode>(mode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState(initialNotice);
  const [googleReady, setGoogleReady] = useState(false);
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';

  useEffect(() => {
    trackEvent('open_modal', { mode });
  }, [mode]);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            setErrorMessage('Google-Login konnte nicht gestartet werden.');
            return;
          }

          setLoading(true);
          setErrorMessage('');
          setInfoMessage('');

          try {
            const response = await fetch(apiUrl('/api/users/google-login'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
              setErrorMessage(data?.detail ?? 'Google-Login fehlgeschlagen.');
              return;
            }

            localStorage.setItem('token', data.access_token);
            trackEvent('login_success', { method: 'google' });
            router.push('/dashboard');
          } catch {
            setErrorMessage('Google-Login aktuell nicht verfügbar. Bitte später erneut versuchen.');
          } finally {
            setLoading(false);
          }
        },
      });

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId, router]);

  const handleGoogleLogin = () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!googleClientId) {
      setErrorMessage('Google-Login ist noch nicht konfiguriert.');
      return;
    }

    if (!googleReady || !window.google?.accounts?.id) {
      setErrorMessage('Google-Login wird geladen. Bitte in 1-2 Sekunden erneut klicken.');
      return;
    }

    window.google.accounts.id.prompt();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await fetch(apiUrl('/api/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.detail ?? data?.message ?? 'Login fehlgeschlagen.');
        return;
      }

      localStorage.setItem('token', data.access_token);
      trackEvent('login_success', { method: 'email', tab: 'login' });
      onClose();
      router.push('/dashboard');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    trackEvent('register_submit', { tab: 'register' });

    try {
      const regRes = await fetch(apiUrl('/api/users/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      const regData = await regRes.json().catch(() => null);
      if (!regRes.ok) {
        setErrorMessage(regData?.detail ?? 'Registrierung fehlgeschlagen.');
        return;
      }

      // Keep the flow fast: register and immediately try login.
      const loginRes = await fetch(apiUrl('/api/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json().catch(() => null);

      if (loginRes.ok && loginData?.access_token) {
        localStorage.setItem('token', loginData.access_token);
        trackEvent('login_success', { method: 'email', tab: 'register_auto_login' });
        onClose();
        router.push('/dashboard');
        return;
      }

      setInfoMessage('Konto erstellt. Bitte melde dich jetzt an.');
      setTab('login');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte prüfe die API-URL und den Server-Status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:p-7">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Schnell starten</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300 transition hover:border-slate-400"
          >
            Schließen
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm font-semibold text-white transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Mit Google
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-300 opacity-70"
            title="Bald verfügbar"
          >
            Mit Apple
          </button>
          <p className="col-span-2 text-center text-xs text-slate-400">Social Login folgt in einem der nächsten Releases.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-slate-700 bg-slate-800/70 p-1">
          <button
            onClick={() => {
              setTab('register');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'register' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Registrieren
          </button>
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'login' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Anmelden
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Starter enthält genau 1 Berechnung. Für weitere Simulationen kannst du danach kostenlos als Beta-Tester freischalten (ohne automatische Abbuchung).
        </div>

        {tab === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Vollständiger Name"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
              required
            />
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
              placeholder="Passwort"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {loading ? 'Erstelle Konto...' : 'Konto erstellen'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Passwort"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-4 text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {loading ? 'Anmeldung läuft...' : 'Jetzt anmelden'}
            </button>
            <div className="text-right text-sm">
              <Link href="/passwort-zuruecksetzen" className="text-cyan-300 hover:underline">
                Passwort vergessen?
              </Link>
            </div>
          </form>
        )}

        {infoMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {infoMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">
          Schneller Zugang ohne Seitenwechsel. Passwort-Reset bleibt verfügbar unter <Link href="/passwort-zuruecksetzen" className="text-cyan-300 hover:underline">Passwort zurücksetzen</Link>.
        </p>
      </div>
    </div>
  );
}
