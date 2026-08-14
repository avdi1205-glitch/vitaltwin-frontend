'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import DashboardBrandMark from '../components/brand/DashboardBrandMark';

// Force dynamic rendering: this page's content is entirely driven by
// client-side auth/chat state, and a previous static/cached build of this
// exact route caused a stale edge-cached HTML shell to be served after
// deploys (visible as a React hydration mismatch, error #418). Opting out of
// static optimization avoids that class of stale-cache bug going forward.
export const dynamic = 'force-dynamic';

const EXAMPLE_QUESTION_KEYS = ['example1', 'example2', 'example3', 'example4', 'example5'] as const;

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

type SourceLabelKey =
  | 'sourceUserReported'
  | 'sourceTrend'
  | 'sourceGoogleHealth'
  | 'sourceCgm'
  | 'sourceNutrition'
  | 'sourceConfirmedMemory'
  | 'sourcePattern'
  | 'sourceBiomarker'
  | 'sourceTwinHistory'
  | 'sourceGeneralWellness'
  | 'sourceUncertain'
  | 'sourceNeedsMoreData';

const SOURCE_TYPE_KEYS: Record<string, SourceLabelKey> = {
  user_reported: 'sourceUserReported',
  trend: 'sourceTrend',
  google_health: 'sourceGoogleHealth',
  cgm: 'sourceCgm',
  nutrition: 'sourceNutrition',
  confirmed_memory: 'sourceConfirmedMemory',
  pattern: 'sourcePattern',
  biomarker: 'sourceBiomarker',
  twin_history: 'sourceTwinHistory',
  general_wellness_info: 'sourceGeneralWellness',
  uncertain: 'sourceUncertain',
  needs_more_data: 'sourceNeedsMoreData',
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
  const t = useTranslations('askTwin');
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
        setErrorMessage(extractErrorMessage(data, t('twinNoAnswer')));
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
      setErrorMessage(t('chatUnavailable'));
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
            <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">{t('caption')}</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA] md:text-3xl">{t('title')}</h1>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            {t('back')}
          </Link>
        </div>
        <p className="mt-2 text-sm text-[#B7BDC4]">
          {t('description')}
        </p>
        <p className="mt-1 text-xs text-[#8E969F]">
          {t('info')}
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-[#B7BDC4]">
          {t('disclaimer')}
        </div>

        {!loadingStatus && status && (
          <p className="mt-2 text-xs text-[#8E969F]">
            {t('quota', { remaining: status.remaining_today, limit: status.daily_limit })}{' '}
            {limitReached && (
              <Link href="/preise" className="text-[#58D7D4] underline hover:text-[#F3C979]">
                {t('upgrade')}
              </Link>
            )}
          </p>
        )}

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          {messages.length === 0 && (
            <div>
              <p className="text-sm text-[#B7BDC4]">{t('examplePrompt')}</p>
              <ul className="mt-3 space-y-2">
                {EXAMPLE_QUESTION_KEYS.map((key) => (
                  <li key={key}>
                    <button
                      onClick={() => sendMessage(t(key))}
                      disabled={sending || limitReached}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t(key)}
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
                    {openWhyIndex === index ? t('hideExplanation') : t('why')}
                  </button>
                  {openWhyIndex === index && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.sources!.map((source, sourceIndex) => (
                        <span
                          key={sourceIndex}
                          className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-[#8E969F]"
                        >
                          {SOURCE_TYPE_KEYS[source.type] ? t(SOURCE_TYPE_KEYS[source.type]) : source.type}: {source.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {msg.role === 'assistant' && msg.needsMoreData && (
                <p className="mt-1 max-w-[85%] text-xs text-[#8E969F]">
                  {t('needsMoreDataNote')}
                </p>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-[#8E969F]">
                {t('thinking')}
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
            placeholder={limitReached ? t('inputLimitReached') : t('inputPlaceholder')}
            disabled={sending || limitReached}
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || limitReached || !input.trim()}
            className="rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('send')}
          </button>
        </form>
      </div>
    </div>
  );
}

