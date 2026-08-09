'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type Recommendation = {
  id: string;
  category: string;
  title: string;
  proposed_action: string;
  priority: 'low' | 'medium' | 'high';
  status: 'proposed' | 'accepted' | 'modified' | 'completed' | 'skipped' | 'rejected' | 'expired';
  confidence: number | null;
};

type Explanation = {
  rule_name: string | null;
  data_used: string[];
  period_days: number | null;
  data_points: number | null;
  data_quality: string | null;
  expected_benefit: string | null;
  type: string;
  disclaimer: string;
};

const FEEDBACK_OPTIONS: { value: 'helpful' | 'partially_helpful' | 'not_helpful'; label: string }[] = [
  { value: 'helpful', label: 'Hilfreich' },
  { value: 'partially_helpful', label: 'Teilweise hilfreich' },
  { value: 'not_helpful', label: 'Nicht hilfreich' },
];

/**
 * Recommendation Loop (Twin Intelligence Core, Etappe 4). Real backend
 * persistence via `/api/recommendations` — rule-based only (see
 * `app/services/recommendation_rules.py`), never a fabricated or AI-written
 * suggestion in this etappe. No aggressive pop-ups: everything is inline,
 * mobile-first (stacked buttons).
 */
export default function DashboardRecommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [modifyingId, setModifyingId] = useState<string | null>(null);
  const [modifiedAction, setModifiedAction] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/recommendations'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage('Empfehlungen konnten nicht geladen werden.');
        return;
      }
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecommendations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecommendations]);

  const decide = async (id: string, decision: 'accepted' | 'modified' | 'skipped' | 'rejected', payload?: { modified_action?: string }) => {
    try {
      await fetch(apiUrl(`/api/recommendations/${id}/decision`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ decision, ...payload }),
      });
      setModifyingId(null);
      setModifiedAction('');
      await loadRecommendations();
    } catch {
      setErrorMessage('Entscheidung konnte nicht gespeichert werden.');
    }
  };

  const markCompleted = async (id: string) => {
    try {
      await fetch(apiUrl(`/api/recommendations/${id}/outcome`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ outcome_status: 'completed', outcome_source: 'user_reported' }),
      });
      await loadRecommendations();
    } catch {
      setErrorMessage('Ergebnis konnte nicht gespeichert werden.');
    }
  };

  const toggleWhy = async (id: string) => {
    if (explanations[id]) {
      setExplanations((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }
    try {
      const response = await fetch(apiUrl(`/api/recommendations/${id}/why`), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (response.ok && data) {
        setExplanations((current) => ({ ...current, [id]: data as Explanation }));
      }
    } catch {
      setErrorMessage('Erklärung konnte nicht geladen werden.');
    }
  };

  const giveFeedback = async (id: string, helpfulness: 'helpful' | 'partially_helpful' | 'not_helpful') => {
    try {
      await fetch(apiUrl(`/api/recommendations/${id}/feedback`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ helpfulness }),
      });
      setFeedbackGiven((current) => ({ ...current, [id]: true }));
    } catch {
      setErrorMessage('Feedback konnte nicht gespeichert werden.');
    }
  };

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">Lade Empfehlungen...</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Dein Twin empfiehlt</h3>
      {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}

      {items.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-[#B7BDC4]">
            Dein Twin braucht noch einige Check-ins, bevor persönliche Empfehlungen möglich sind.
          </p>
          <Link
            href="#gewohnheiten"
            className="mt-3 inline-block rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
          >
            Check-in starten
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F5F2EA]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#B7BDC4]">{item.proposed_action}</p>
                </div>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8E969F]">
                  {item.priority === 'high' ? 'Hoch' : item.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
              </div>

              {item.status === 'proposed' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => void decide(item.id, 'accepted')}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
                  >
                    ✓ Plan übernehmen
                  </button>
                  <button
                    onClick={() => setModifyingId(modifyingId === item.id ? null : item.id)}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60"
                  >
                    Aktion verändern
                  </button>
                  <button
                    onClick={() => void decide(item.id, 'skipped')}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-[#B7BDC4] transition hover:border-white/30"
                  >
                    Überspringen
                  </button>
                  <button
                    onClick={() => void decide(item.id, 'rejected')}
                    className="rounded-full border border-red-400/25 px-4 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10"
                  >
                    Ablehnen
                  </button>
                </div>
              )}

              {modifyingId === item.id && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={modifiedAction}
                    onChange={(e) => setModifiedAction(e.target.value)}
                    placeholder="Wie möchtest du es stattdessen angehen?"
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
                  />
                  <button
                    onClick={() => void decide(item.id, 'modified', { modified_action: modifiedAction })}
                    disabled={!modifiedAction.trim()}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Speichern
                  </button>
                </div>
              )}

              {(item.status === 'accepted' || item.status === 'modified') && (
                <div className="mt-3">
                  <button
                    onClick={() => void markCompleted(item.id)}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-1.5 text-xs font-semibold text-[#0B1118] transition hover:brightness-110"
                  >
                    Als erledigt markieren
                  </button>
                </div>
              )}

              {item.status === 'completed' && !feedbackGiven[item.id] && (
                <div className="mt-3">
                  <p className="text-xs text-[#8E969F]">War das hilfreich?</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {FEEDBACK_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => void giveFeedback(item.id, option.value)}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#B7BDC4] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {feedbackGiven[item.id] && <p className="mt-3 text-xs text-[#8E969F]">Danke für dein Feedback.</p>}

              <button
                onClick={() => void toggleWhy(item.id)}
                className="mt-3 text-xs font-semibold text-[#8E969F] underline hover:text-[#58D7D4]"
              >
                {explanations[item.id] ? 'Erklärung ausblenden' : 'Warum?'}
              </button>

              {explanations[item.id] && (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-[#B7BDC4]">
                  <p>Regel: {explanations[item.id].rule_name ?? 'unbekannt'} ({explanations[item.id].type})</p>
                  <p className="mt-1">
                    Datenbasis: {explanations[item.id].data_used.join(', ') || '–'} · Zeitraum:{' '}
                    {explanations[item.id].period_days ?? '–'} Tage · {explanations[item.id].data_points ?? 0} Datenpunkte ·
                    Qualität: {explanations[item.id].data_quality ?? '–'}
                  </p>
                  {explanations[item.id].expected_benefit && <p className="mt-1">Erwarteter Nutzen: {explanations[item.id].expected_benefit}</p>}
                  <p className="mt-2 text-[#6B7480]">{explanations[item.id].disclaimer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
