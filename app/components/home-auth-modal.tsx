'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
            }
          ) => void;
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
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

      // Google's One Tap `prompt()` is designed to appear unprompted and is
      // subject to silent exponential-cooldown suppression after a user
      // dismisses it once — clicking a button and getting nothing is a known,
      // expected outcome of relying on `prompt()` for a manually-triggered
      // login. `renderButton()` is Google's own always-visible, always-
      // clickable Sign-In button and is the correct API for this use case.
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'de',
        });
      }
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1118] p-5 shadow-2xl sm:my-6 sm:max-h-[calc(100vh-3rem)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-xl font-bold text-[#F5F2EA] sm:text-2xl">Schnell starten</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-sm text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
          >
            Schließen
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6">
          <div className="relative flex items-center justify-center overflow-hidden rounded-xl">
            <div ref={googleButtonRef} className="flex w-full justify-center [&>div]:w-full" />
            {!googleClientId && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs text-[#8E969F]">
                Google-Login lädt…
              </div>
            )}
            {tab === 'register' && !acceptedTerms && (
              <button
                type="button"
                aria-label="Bitte zuerst AGB und Datenschutzerklärung akzeptieren"
                className="absolute inset-0 cursor-pointer rounded-xl"
                onClick={() =>
                  setErrorMessage('Bitte akzeptiere die AGB und Datenschutzerklärung, um ein Konto zu erstellen.')
                }
              />
            )}
            {loading && (tab !== 'register' || acceptedTerms) && (
              <div className="absolute inset-0 cursor-not-allowed rounded-xl bg-[#0B1118]/70" aria-hidden="true" />
            )}
          </div>
          <button
            type="button"
            disabled
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#8E969F] opacity-70"
            title="Bald verfügbar"
          >
            Mit Apple
          </button>
          <p className="col-span-2 text-center text-xs text-[#8E969F]">Apple-Login folgt in einem der nächsten Releases.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => {
              setTab('register');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'register' ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'text-[#B7BDC4] hover:text-[#58D7D4]'}`}
          >
            Registrieren
          </button>
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              setInfoMessage('');
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === 'login' ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'text-[#B7BDC4] hover:text-[#58D7D4]'}`}
          >
            Anmelden
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
          Starter enthält genau 1 Berechnung. Für weitere Simulationen kannst du danach kostenlos als Beta-Tester freischalten (ohne automatische Abbuchung).
        </div>

        {tab === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Vollständiger Name"
              className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
              required
            />
            <label className="flex items-start gap-2 text-xs text-[#B7BDC4]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-[#58D7D4]"
                required
              />
              <span>
                Ich akzeptiere die{' '}
                <Link href="/agb" target="_blank" className="text-[#58D7D4] hover:underline">AGB</Link> und die{' '}
                <Link href="/datenschutz" target="_blank" className="text-[#58D7D4] hover:underline">Datenschutzerklärung</Link>.
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-3 font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
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
              className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-[#F5F2EA] placeholder:text-[#6B7480]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-3 font-semibold text-[#0B1118] transition hover:brightness-110 disabled:opacity-70"
            >
              {loading ? 'Anmeldung läuft...' : 'Jetzt anmelden'}
            </button>
            <p className="text-right text-sm text-[#8E969F]">
              <Link href="/passwort-vergessen" className="text-[#58D7D4] hover:underline">
                Passwort vergessen?
              </Link>
            </p>
          </form>
        )}

        {infoMessage && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
            {infoMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <p className="mt-5 text-center text-xs text-[#8E969F]">
          Schneller Zugang ohne Seitenwechsel. Passwort ändern kannst du jederzeit eingeloggt im Dashboard oder über <Link href="/passwort-vergessen" className="text-[#58D7D4] hover:underline">Passwort vergessen</Link>.
        </p>
      </div>
    </div>
  );
}
