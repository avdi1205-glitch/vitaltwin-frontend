'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

type PlanAction = {
  id: string;
  description: string;
  user_adjusted_description: string | null;
  reasoning: string | null;
  estimated_effort: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'proposed' | 'accepted' | 'modified' | 'completed' | 'skipped' | 'rejected';
  carried_over: boolean;
};

type DailyReflection = {
  completed_summary: string;
  helpful_note: string;
  difficult_note: string;
  mood: number | null;
  energy: number | null;
  tomorrow_change: string;
};

const EMPTY_REFLECTION: DailyReflection = {
  completed_summary: '',
  helpful_note: '',
  difficult_note: '',
  mood: null,
  energy: null,
  tomorrow_change: '',
};

/**
 * Daily Planning Loop + Evening Reflection Loop (Twin Intelligence Core,
 * Etappe 6). Höchstens drei priorisierte Aktionen (`GET /api/planning/today`
 * generiert sie einmalig pro Tag, serverseitig gedeckelt), jede mit
 * verständlicher Begründung und Aufwand. Mobile-first, bewusst schlicht
 * gehalten ("keine Informationsflut"/"keine Überladung").
 */
export default function DashboardDailyPlan() {
  const t = useTranslations('dailyPlan');
  const [actions, setActions] = useState<PlanAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustedText, setAdjustedText] = useState('');
  const [reflection, setReflection] = useState<DailyReflection>(EMPTY_REFLECTION);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadPlan = useCallback(async () => {
    try {
      const [planResponse, reflectionResponse] = await Promise.all([
        fetch(apiUrl('/api/planning/today'), { headers: authHeader() }),
        fetch(apiUrl('/api/planning/reflection/today'), { headers: authHeader() }),
      ]);
      const planData = await planResponse.json().catch(() => null);
      const reflectionData = await reflectionResponse.json().catch(() => null);
      if (!planResponse.ok) {
        setErrorMessage(t('loadError'));
        return;
      }
      setActions(Array.isArray(planData?.actions) ? planData.actions : []);
      if (reflectionData?.item) {
        setReflection({
          completed_summary: reflectionData.item.completed_summary ?? '',
          helpful_note: reflectionData.item.helpful_note ?? '',
          difficult_note: reflectionData.item.difficult_note ?? '',
          mood: reflectionData.item.mood ?? null,
          energy: reflectionData.item.energy ?? null,
          tomorrow_change: reflectionData.item.tomorrow_change ?? '',
        });
        setReflectionSaved(true);
      }
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [authHeader, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlan();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPlan]);

  const decide = async (id: string, decision: 'accepted' | 'rejected') => {
    try {
      await fetch(apiUrl(`/api/planning/actions/${id}/decision`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ decision }),
      });
      await loadPlan();
    } catch {
      setErrorMessage(t('decisionError'));
    }
  };

  const complete = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/planning/actions/${id}/complete`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      await loadPlan();
    } catch {
      setErrorMessage(t('completeError'));
    }
  };

  const submitAdjustment = async (id: string) => {
    if (!adjustedText.trim()) return;
    try {
      await fetch(apiUrl(`/api/planning/actions/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ description: adjustedText.trim() }),
      });
      setAdjustingId(null);
      setAdjustedText('');
      await loadPlan();
    } catch {
      setErrorMessage(t('adjustError'));
    }
  };

  const submitReflection = async () => {
    try {
      await fetch(apiUrl('/api/planning/reflection'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(reflection),
      });
      setReflectionSaved(true);
    } catch {
      setErrorMessage(t('reflectionError'));
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

      {actions.length === 0 ? (
        <p className="mt-3 text-sm text-[#B7BDC4]">
          {t('empty')}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#F5F2EA]">
                  {action.user_adjusted_description || action.description}
                </p>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8E969F]">
                  {action.priority === 'high' ? t('priorityHigh') : action.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
                </span>
              </div>
              {action.reasoning && <p className="mt-1 text-xs text-[#8E969F]">{action.reasoning}</p>}
              {action.estimated_effort && <p className="mt-1 text-xs text-[#6B7480]">{t('effort')} {action.estimated_effort}</p>}
              {action.carried_over && <p className="mt-1 text-xs text-[#58D7D4]">{t('carriedOver')}</p>}

              {action.status === 'proposed' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void decide(action.id, 'accepted')}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
                  >
                    {t('accept')}
                  </button>
                  <button
                    onClick={() => {
                      setAdjustingId(adjustingId === action.id ? null : action.id);
                      setAdjustedText(action.description);
                    }}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
                  >
                    {t('adjust')}
                  </button>
                  <button
                    onClick={() => void decide(action.id, 'rejected')}
                    className="rounded-full border border-red-400/25 px-4 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10"
                  >
                    {t('reject')}
                  </button>
                </div>
              )}

              {(action.status === 'accepted' || action.status === 'modified') && (
                <div className="mt-3">
                  <button
                    onClick={() => void complete(action.id)}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
                  >
                    {t('complete')}
                  </button>
                </div>
              )}
              {action.status === 'completed' && <p className="mt-2 text-xs text-[#58D7D4]">{t('completedStatus')}</p>}

              {adjustingId === action.id && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={adjustedText}
                    onChange={(e) => setAdjustedText(e.target.value)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                  <button
                    onClick={() => void submitAdjustment(action.id)}
                    disabled={!adjustedText.trim()}
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

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          onClick={() => setShowReflection(!showReflection)}
          className="text-sm font-semibold text-[#8E969F] underline hover:text-[#58D7D4]"
        >
          {showReflection ? t('hideReflection') : reflectionSaved ? t('editReflection') : t('startReflection')}
        </button>

        {showReflection && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder={t('reflectWhat')}
              value={reflection.completed_summary}
              onChange={(e) => setReflection({ ...reflection, completed_summary: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
            />
            <input
              type="text"
              placeholder={t('reflectHelpful')}
              value={reflection.helpful_note}
              onChange={(e) => setReflection({ ...reflection, helpful_note: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
            />
            <input
              type="text"
              placeholder={t('reflectDifficult')}
              value={reflection.difficult_note}
              onChange={(e) => setReflection({ ...reflection, difficult_note: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
            />
            <input
              type="text"
              placeholder={t('reflectTomorrow')}
              value={reflection.tomorrow_change}
              onChange={(e) => setReflection({ ...reflection, tomorrow_change: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
            />
            <button
              onClick={() => void submitReflection()}
              className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
            >
              {t('saveReflection')}
            </button>
            {reflectionSaved && <p className="text-xs text-[#8E969F]">{t('saved')}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
