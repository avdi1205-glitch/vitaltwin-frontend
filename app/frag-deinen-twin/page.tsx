'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

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
};

type ChatStatus = {
  daily_limit: number;
  used_today: number;
  remaining_today: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (data) setStatus(data);
    } catch {
      // Non-fatal — limit display just stays hidden.
    } finally {
      setLoadingStatus(false);
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

      setMessages((current) => [...current, { role: 'assistant', text: data.reply }]);
      setStatus((current) => (current ? { ...current, remaining_today: data.remaining_today, used_today: current.daily_limit - data.remaining_today } : current));
    } catch {
      setErrorMessage('Der Twin-Chat ist gerade nicht erreichbar. Bitte versuche es in Kürze erneut.');
    } finally {
      setSending(false);
    }
  };

  const limitReached = status ? status.remaining_today <= 0 : false;

  return (
    <div className="flex min-h-screen flex-col bg-[#F5EFE1] text-neutral-900">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">VitalTwin Intelligence</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-2xl font-semibold md:text-3xl">Frag deinen Twin</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-neutral-900 underline hover:text-black">
            Dashboard
          </Link>
        </div>
        <p className="mt-2 text-sm text-neutral-700">
          Erhalte persönliche Impulse auf Basis deiner freiwillig gespeicherten Wellness-Daten.
        </p>

        <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600">
          KI-Antworten können Fehler enthalten und sind keine medizinische Beratung. Du entscheidest selbst, welche
          Empfehlungen du umsetzt.
        </div>

        {!loadingStatus && status && (
          <p className="mt-2 text-xs text-neutral-500">
            {status.remaining_today} von {status.daily_limit} Anfragen heute übrig.{' '}
            {limitReached && (
              <Link href="/preise" className="underline hover:text-black">
                Für mehr Anfragen upgraden
              </Link>
            )}
          </p>
        )}

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-5">
          {messages.length === 0 && (
            <div>
              <p className="text-sm text-neutral-600">Stell deinem Twin eine Frage, zum Beispiel:</p>
              <ul className="mt-3 space-y-2">
                {EXAMPLE_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button
                      onClick={() => sendMessage(question)}
                      disabled={sending || limitReached}
                      className="w-full rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-left text-sm text-neutral-800 transition hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'bg-black text-white' : 'border border-neutral-200 bg-[#F5EFE1] text-neutral-900'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-neutral-200 bg-[#F5EFE1] px-4 py-3 text-sm text-neutral-500">
                Twin denkt nach...
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
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
            className="flex-1 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || limitReached || !input.trim()}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </div>
    </div>
  );
}

