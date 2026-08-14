'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

type MemoryStatus = 'candidate' | 'active' | 'confirmed' | 'disputed' | 'archived' | 'deleted';

type TwinMemory = {
  id: string;
  memory_type: string;
  title: string;
  human_readable_value: string;
  source: string;
  source_references: string[];
  confidence: number | null;
  status: MemoryStatus;
  user_confirmed: boolean;
};

type TwinPattern = {
  id: string;
  pattern_type: string;
  summary: string;
  confidence: number | null;
  data_points: number;
  contradicting: boolean;
  status: 'active' | 'discarded';
};

/**
 * Memory Loop (Twin Intelligence Core, Etappe 5). "Was dein Twin über dich
 * gelernt hat" — zeigt jede gespeicherte Memory mit Herkunft, Begründung und
 * verständlicher Konfidenz, plus die dazugehörigen Nutzerkontrollen
 * (bestätigen/korrigieren/ablehnen/archivieren/löschen). Zeigt zusätzlich
 * transparent erkannte Muster (nie als Kausalität formuliert, siehe
 * `services/pattern_detection.py`).
 */
export default function DashboardTwinMemory() {
  const t = useTranslations('memory');
  const statusLabels: Record<MemoryStatus, string> = {
    candidate: t('statusCandidate'),
    active: t('statusActive'),
    confirmed: t('statusConfirmed'),
    disputed: t('statusDisputed'),
    archived: t('statusArchived'),
    deleted: t('statusDeleted'),
  };
  const confidenceLabel = (confidence: number | null): string => {
    if (confidence === null) return t('confidenceUnknown');
    if (confidence >= 0.75) return t('confidenceHigh');
    if (confidence >= 0.5) return t('confidenceMedium');
    return t('confidenceLow');
  };
  const [memories, setMemories] = useState<TwinMemory[]>([]);
  const [patterns, setPatterns] = useState<TwinPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    try {
      const [memoryResponse, patternResponse] = await Promise.all([
        fetch(apiUrl('/api/memory'), { headers: authHeader() }),
        fetch(apiUrl('/api/memory/patterns'), { headers: authHeader() }),
      ]);
      const memoryData = await memoryResponse.json().catch(() => null);
      const patternData = await patternResponse.json().catch(() => null);
      if (!memoryResponse.ok || !patternResponse.ok) {
        setErrorMessage(t('loadError'));
        return;
      }
      const visibleMemories = (Array.isArray(memoryData?.items) ? memoryData.items : []).filter(
        (item: TwinMemory) => item.status !== 'deleted',
      );
      setMemories(visibleMemories);
      setPatterns(Array.isArray(patternData?.items) ? patternData.items : []);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [authHeader, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const runAction = async (id: string, action: 'confirm' | 'reject' | 'archive') => {
    try {
      await fetch(apiUrl(`/api/memory/${id}/${action}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({}),
      });
      await load();
    } catch {
      setErrorMessage(t('actionError'));
    }
  };

  const submitCorrection = async (id: string) => {
    if (!correctionValue.trim()) return;
    try {
      await fetch(apiUrl(`/api/memory/${id}/correct`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ human_readable_value: correctionValue.trim() }),
      });
      setCorrectingId(null);
      setCorrectionValue('');
      await load();
    } catch {
      setErrorMessage(t('correctError'));
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/memory/${id}`), { method: 'DELETE', headers: authHeader() });
      setMemories((current) => current.filter((memory) => memory.id !== id));
    } catch {
      setErrorMessage(t('deleteError'));
    }
  };

  const discardPattern = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/memory/patterns/${id}/discard`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({}),
      });
      setPatterns((current) => current.filter((pattern) => pattern.id !== id));
    } catch {
      setErrorMessage(t('discardError'));
    }
  };

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">{t('loading')}</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
        {t('title')}
      </h3>
      {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}

      {memories.length === 0 ? (
        <p className="mt-3 text-sm text-[#B7BDC4]">
          {t('empty')}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {memories.map((memory) => (
            <div key={memory.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F2EA]">{memory.title}</p>
                  <p className="mt-1 text-sm text-[#B7BDC4]">{memory.human_readable_value}</p>
                </div>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8E969F]">
                  {statusLabels[memory.status]}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#6B7480]">
                {t('sourceLabel')} {memory.source === 'user_reported' ? t('sourceUser') : t('sourceCalculated')} · {t('confidenceLabel')}{' '}
                {confidenceLabel(memory.confidence)}
              </p>

              {memory.status !== 'archived' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {memory.status !== 'confirmed' && (
                    <button
                      onClick={() => void runAction(memory.id, 'confirm')}
                      className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
                    >
                      {t('confirm')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCorrectingId(correctingId === memory.id ? null : memory.id);
                      setCorrectionValue(memory.human_readable_value);
                    }}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
                  >
                    {t('correct')}
                  </button>
                  {memory.status !== 'disputed' && (
                    <button
                      onClick={() => void runAction(memory.id, 'reject')}
                      className="rounded-full border border-red-400/25 px-4 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10"
                    >
                      {t('reject')}
                    </button>
                  )}
                  <button
                    onClick={() => void runAction(memory.id, 'archive')}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-[#B7BDC4] transition hover:border-white/30"
                  >
                    {t('archive')}
                  </button>
                  <button
                    onClick={() => void deleteMemory(memory.id)}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-[#8E969F] transition hover:border-red-400/40 hover:text-red-300"
                  >
                    {t('delete')}
                  </button>
                </div>
              )}

              {correctingId === memory.id && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={correctionValue}
                    onChange={(e) => setCorrectionValue(e.target.value)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
                  />
                  <button
                    onClick={() => void submitCorrection(memory.id)}
                    disabled={!correctionValue.trim()}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('save')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {patterns.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold text-[#F5F2EA]">{t('patternsTitle')}</h4>
          <div className="mt-3 space-y-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm text-[#B7BDC4]">{pattern.summary}</p>
                <p className="mt-1 text-xs text-[#6B7480]">
                  {t('confidenceLabel')} {confidenceLabel(pattern.confidence)} · {pattern.data_points} {t('dataPoints')}
                  {pattern.contradicting && ` · ${t('contradicting')}`}
                </p>
                <button
                  onClick={() => void discardPattern(pattern.id)}
                  className="mt-2 rounded-full border border-white/15 px-3 py-1 text-xs text-[#8E969F] transition hover:border-white/30"
                >
                  {t('discardPattern')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
