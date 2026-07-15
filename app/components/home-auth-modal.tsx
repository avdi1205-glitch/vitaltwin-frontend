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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

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

    if (tab === 'register' && !acceptedTerms) {
      setErrorMessage('Bitte akzeptiere die AGB und Datenschutzerklärung, um ein Konto zu erstellen.');
      return;
    }

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
    setErrorMessage('');
    setInfoMessage('');

    if (!acceptedTerms) {
      setErrorMessage('Bitte akzeptiere die AGB und Datenschutzerklärung, um ein Konto zu erstellen.');
      return;
    }

    setLoading(true);
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-stone-700 bg-stone-900 p-5 shadow-2xl shadow-black/50 sm:my-6 sm:max-h-[calc(100vh-3rem)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Schnell starten</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-stone-600 px-3 py-1 text-sm text-stone-300 transition hover:border-stone-400"
          >
            Schließen
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="rounded-xl border border-stone-600 bg-stone-800/80 px-3 py-2 text-sm font-semibold text-white transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Mit Google
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl border border-stone-700 bg-stone-800/80 px-3 py-2 text-sm font-semibold text-stone-300 opacity-70"
            title="Bald verfügbar"
          >
            Mit Apple
          </button>
          <p className="col-span-2 text-center text-xs text-stone-400">Social Login folgt in einem der nächsten Releases.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-stone-700 bg-stone-800/70 p-1">
          <button
            onClick={() => {
              setTab('register');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'register' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:text-white'}`}
          >
            Registrieren
          </button>
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'login' ? 'bg-amber-500 text-white' : 'text-stone-300 hover:text-white'}`}
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
              className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
              required
            />
            <label className="flex items-start gap-2 text-xs text-stone-300">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-600 bg-stone-800 accent-amber-500"
                required
              />
              <span>
                Ich akzeptiere die{' '}
                <Link href="/agb" target="_blank" className="text-amber-300 hover:underline">AGB</Link> und die{' '}
                <Link href="/datenschutz" target="_blank" className="text-amber-300 hover:underline">Datenschutzerklärung</Link>.
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
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
              className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-2xl border border-stone-700 bg-stone-800 p-4 text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {loading ? 'Anmeldung läuft...' : 'Jetzt anmelden'}
            </button>
            <p className="text-right text-sm text-stone-400">
              <Link href="/passwort-vergessen" className="text-amber-300 hover:underline">
                Passwort vergessen?
              </Link>
            </p>
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

        <p className="mt-5 text-center text-xs text-stone-400">
          Schneller Zugang ohne Seitenwechsel. Passwort ändern kannst du jederzeit eingeloggt im Dashboard oder über <Link href="/passwort-vergessen" className="text-amber-300 hover:underline">Passwort vergessen</Link>.
        </p>
      </div>
    </div>
  );
}
