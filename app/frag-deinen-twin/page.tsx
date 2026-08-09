'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import DashboardBrandMark from '../components/brand/DashboardBrandMark';

// Force dynamic rendering: this page's content is entirely driven by
// client-side auth/chat state, and a previous static/cached build of this
// exact route caused a stale edge-cached HTML shell to be served after
// deploys (visible as a React hydration mismatch, error #418). Opting out of
// static optimization avoids that class of stale-cache bug going forward.
export const dynamic = 'force-dynamic';

const EXAMPLE_QUESTIONS = [
  'Wie war meine Woche?',
  'Was kann ich heute verbessern?',
  'Wie kann ich regelmäßiger schlafen?',
  'Welche Gewohnheit sollte ich zuerst aufbauen?',
  'Wie entwickle ich mehr Bewegung im Alltag?',
];

const MAX_INPUT_LENGTH = 500;

type Message = {
  role: 'user' | 'assistant';
  text: string;
  sources?: { type: string; label: string }[];
  needsMoreData?: boolean;
  safetyTriggered?: boolean;
};

type ChatStatus = {
  daily_limit: number;
  used_today: number;
  remaining_today: number;
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  user_reported: 'Nutzerangabe',
  trend: 'Berechneter Trend',
  confirmed_memory: 'Bestätigte Memory',
  pattern: 'Mögliches Muster',
  general_wellness_info: 'Allgemeine Wellness-Information',
  uncertain: 'Unsicher',
  needs_more_data: 'Benötigt mehr Daten',
};

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const payload = data as { detail?: unknown };
  if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0] as { msg?: string };
    if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg;
  }
  return fallback;
}

export default function FragDeinenTwin() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [openWhyIndex, setOpenWhyIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/chat/status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push('/?auth=login');
        return;
      }
      const data = (await res.json().catch(() => null)) as ChatStatus | null;
      if (!isMountedRef.current) return;
      if (data) setStatus(data);
    } catch {
      // Non-fatal — limit display just stays hidden.
    } finally {
      if (isMountedRef.current) setLoadingStatus(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus(token);
  }, [router, loadStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    setErrorMessage('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(apiUrl('/api/chat/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(extractErrorMessage(data, 'Twin konnte nicht antworten. Bitte versuche es erneut.'));
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.reply,
          sources: Array.isArray(data.sources) ? data.sources : [],
          needsMoreData: Boolean(data.needs_more_data),
          safetyTriggered: Boolean(data.safety_triggered),
        },
      ]);
      setStatus((current) => (current ? { ...current, remaining_today: data.remaining_today, used_today: current.daily_limit - data.remaining_today } : current));
    } catch {
      setErrorMessage('Der Twin-Chat ist gerade nicht erreichbar. Bitte versuche es in Kürze erneut.');
    } finally {
      setSending(false);
    }
  };

  const limitReached = status ? status.remaining_today <= 0 : false;

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 md:px-6">
        <DashboardBrandMark />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">VitalTwin Intelligence</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA] md:text-3xl">Frag deinen Twin</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            Dashboard
          </Link>
        </div>
        <p className="mt-2 text-sm text-[#B7BDC4]">
          Erhalte persönliche Impulse auf Basis deiner freiwillig gespeicherten Wellness-Daten.
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#B7BDC4]">
          KI-Antworten können Fehler enthalten und sind keine medizinische Beratung. Du entscheidest selbst, welche
          Empfehlungen du umsetzt.
        </div>

        {!loadingStatus && status && (
          <p className="mt-2 text-xs text-[#8E969F]">
            {status.remaining_today} von {status.daily_limit} Anfragen heute übrig.{' '}
            {limitReached && (
              <Link href="/preise" className="text-[#58D7D4] underline hover:text-[#F3C979]">
                Für mehr Anfragen upgraden
              </Link>
            )}
          </p>
        )}

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          {messages.length === 0 && (
            <div>
              <p className="text-sm text-[#B7BDC4]">Stell deinem Twin eine Frage, zum Beispiel:</p>
              <ul className="mt-3 space-y-2">
                {EXAMPLE_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button
                      onClick={() => sendMessage(question)}
                      disabled={sending || limitReached}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'bg-gradient-to-r from-[#F3C979] to-[#C9913D] text-[#0B1118]' : 'border border-white/10 bg-white/[0.02] text-[#F5F2EA]'
                }`}
              >
                {msg.text}
              </div>

              {msg.role === 'assistant' && (msg.sources?.length ?? 0) > 0 && (
                <div className="mt-1 max-w-[85%]">
                  <button
                    onClick={() => setOpenWhyIndex(openWhyIndex === index ? null : index)}
                    className="text-xs font-semibold text-[#8E969F] underline hover:text-[#58D7D4]"
                  >
                    {openWhyIndex === index ? 'Erklärung ausblenden' : 'Warum?'}
                  </button>
                  {openWhyIndex === index && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.sources!.map((source, sourceIndex) => (
                        <span
                          key={sourceIndex}
                          className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-[#8E969F]"
                        >
                          {SOURCE_TYPE_LABELS[source.type] ?? source.type}: {source.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {msg.role === 'assistant' && msg.needsMoreData && (
                <p className="mt-1 max-w-[85%] text-xs text-[#8E969F]">
                  Dem Twin fehlen noch ausreichend Daten, um das sicher einzuschätzen.
                </p>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#8E969F]">
                Twin denkt nach...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            placeholder={limitReached ? 'Tageslimit erreicht' : 'Deine Frage an deinen Twin...'}
            disabled={sending || limitReached}
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || limitReached || !input.trim()}
            className="rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </div>
    </div>
  );
}

