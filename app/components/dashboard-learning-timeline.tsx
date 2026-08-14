'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

type TimelineCategory =
  | 'LEARNED'
  | 'CONFIRMED'
  | 'UPDATED'
  | 'CORRECTED_BY_USER'
  | 'DISCARDED'
  | 'FEEDBACK_ADAPTATION'
  | 'CONTRADICTED';

type TimelineEntry = {
  id: string;
  occurred_at: string | null;
  category: TimelineCategory;
  related_domain: string;
  title: string;
  summary: string;
  confidence_before: number | null;
  confidence_after: number | null;
  current_status: string | null;
  is_current: boolean | null;
};

type TimelineResponse = {
  items: TimelineEntry[];
  limit: number;
  offset: number;
  has_more: boolean;
};

type CategoryKey = 'categoryLearned' | 'categoryConfirmed' | 'categoryUpdated' | 'categoryCorrected' | 'categoryDiscarded' | 'categoryFeedback' | 'categoryContradicted';

const CATEGORY_KEYS: Record<TimelineCategory, CategoryKey> = {
  LEARNED: 'categoryLearned',
  CONFIRMED: 'categoryConfirmed',
  UPDATED: 'categoryUpdated',
  CORRECTED_BY_USER: 'categoryCorrected',
  DISCARDED: 'categoryDiscarded',
  FEEDBACK_ADAPTATION: 'categoryFeedback',
  CONTRADICTED: 'categoryContradicted',
};

const CATEGORY_COLORS: Record<TimelineCategory, string> = {
  LEARNED: 'border-[#58D7D4]/40 text-[#58D7D4]',
  CONFIRMED: 'border-[#58D7D4]/40 text-[#58D7D4]',
  UPDATED: 'border-[#F3C979]/40 text-[#F3C979]',
  CORRECTED_BY_USER: 'border-[#F3C979]/40 text-[#F3C979]',
  DISCARDED: 'border-white/20 text-[#8E969F]',
  FEEDBACK_ADAPTATION: 'border-[#58D7D4]/40 text-[#58D7D4]',
  CONTRADICTED: 'border-[#F3C979]/40 text-[#F3C979]',
};

const PAGE_SIZE = 20;

function formatOccurredAt(occurredAt: string | null): string | null {
  if (!occurredAt) return null;
  const parsed = new Date(occurredAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function confidenceDelta(before: number | null, after: number | null, confidenceLabelPrefix: string): string | null {
  if (after === null) return null;
  if (before === null) return `${confidenceLabelPrefix} ${Math.round(after * 100)}%`;
  return `${confidenceLabelPrefix} ${Math.round(before * 100)}% → ${Math.round(after * 100)}%`;
}

/**
 * Twin Core Phase 5 — "Was dein Twin über dich gelernt hat": eine
 * chronologische, kundenverständliche Zusammenfassung bereits persistierter
 * Twin-Learning-Events (`GET /api/memory/learning-timeline`) — kein
 * technischer Audit-Log, keine rohen event_type/JSON-Werte.
 */
export default function DashboardLearningTimeline() {
  const t = useTranslations('timeline');
  const [items, setItems] = useState<TimelineEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl(`/api/memory/learning-timeline?limit=${PAGE_SIZE}&offset=0`), {
        headers: authHeader(),
      });
      const data: TimelineResponse | null = await response.json().catch(() => null);
      if (!response.ok || !data) {
        setErrorMessage(t('loadError'));
        return;
      }
      setItems(data.items);
      setHasMore(data.has_more);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [authHeader, t]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const response = await fetch(
        apiUrl(`/api/memory/learning-timeline?limit=${PAGE_SIZE}&offset=${items.length}`),
        { headers: authHeader() },
      );
      const data: TimelineResponse | null = await response.json().catch(() => null);
      if (!response.ok || !data) {
        setErrorMessage(t('loadMoreError'));
        return;
      }
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.has_more);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoadingMore(false);
    }
  }, [authHeader, items.length, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
        {t('title')}
      </h3>
      <p className="mt-2 text-sm text-[#8E969F]">
        {t('description')}
      </p>

      {loading && <p className="mt-4 text-sm text-[#8E969F]">{t('loading')}</p>}
      {!loading && errorMessage && <p className="mt-3 text-xs text-red-300">{errorMessage}</p>}

      {!loading && !errorMessage && items.length === 0 && (
        <p className="mt-4 text-sm text-[#B7BDC4]">
          {t('empty')}
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const dateLabel = formatOccurredAt(item.occurred_at);
            const confidenceLabel = confidenceDelta(item.confidence_before, item.confidence_after, t('confidenceLabel'));
            return (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[item.category]}`}
                  >
                    {t(CATEGORY_KEYS[item.category]) ?? item.category}
                  </span>
                  {dateLabel && <span className="text-xs text-[#8E969F]">{dateLabel}</span>}
                </div>
                <p className="mt-2 text-sm font-semibold text-[#F5F2EA]">{item.title}</p>
                <p className="mt-1 text-sm text-[#B7BDC4] break-words">{item.summary}</p>
                {(confidenceLabel || item.is_current === false) && (
                  <p className="mt-2 text-xs text-[#8E969F]">
                    {confidenceLabel}
                    {confidenceLabel && item.is_current === false ? ' · ' : ''}
                    {item.is_current === false ? t('outdated') : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingMore ? t('loadMoreBusy') : t('loadMore')}
        </button>
      )}
    </article>
  );
}
