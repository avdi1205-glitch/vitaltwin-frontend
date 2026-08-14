'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';

type Habit = {
  id: string;
  name: string;
  category: string;
  frequency: string;
  active: boolean;
  status: 'active' | 'paused' | 'archived';
  completed_today: boolean;
  current_streak: number;
  longest_streak: number;
  completion_rate_7d: number;
  completion_rate_30d: number;
};

/**
 * Habit Loop widget (Twin Intelligence Core, Etappe 3). Reads/writes the
 * real backend (`/api/profile/habits`, `/api/profile/habits/{id}/entries`)
 * instead of `localStorage` — the previous implementation lost all habits on
 * logout/device change (flagged as a known gap in `docs/DATA_ARCHITECTURE.md`
 * after Etappe 2). Streaks and completion rates are computed server-side
 * (`app/services/habit_service.py`), never invented client-side.
 */
export default function DashboardHabits() {
  const t = useTranslations('habits');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [newHabit, setNewHabit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/profile/habits'), { headers: authHeader() });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(t('loadError'));
        return;
      }
      setHabits(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setLoading(false);
    }
  }, [authHeader, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHabits();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHabits]);

  const activeHabits = habits.filter((habit) => habit.status !== 'archived');

  const addHabit = async () => {
    const label = newHabit.trim();
    if (!label || saving) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('/api/profile/habits'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        // Quick-add from the dashboard keeps category/frequency at sensible
        // defaults — full editing (category, frequency, reminder) happens on
        // the Profil page, which already has the detailed form.
        body: JSON.stringify({ name: label, category: 'sonstiges', frequency: 'taeglich' }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.detail ?? t('createError'));
        return;
      }
      setNewHabit('');
      setShowAddForm(false);
      await loadHabits();
    } catch {
      setErrorMessage(t('backendError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleToday = async (habit: Habit) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await fetch(apiUrl(`/api/profile/habits/${habit.id}/entries`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ entry_date: today, completed: !habit.completed_today }),
      });
      await loadHabits();
    } catch {
      setErrorMessage(t('entryError'));
    }
  };

  const removeHabit = async (habitId: string) => {
    try {
      await fetch(apiUrl(`/api/profile/habits/${habitId}`), { method: 'DELETE', headers: authHeader() });
      await loadHabits();
    } catch {
      setErrorMessage(t('deleteError'));
    }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('title')}</h3>
        <button
          onClick={() => setShowAddForm((current) => !current)}
          className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
        >
          {t('add')}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addHabit();
            }}
            placeholder={t('placeholder')}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
          <button
            onClick={() => void addHabit()}
            disabled={saving}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      )}

      {errorMessage && <p className="mt-3 text-xs text-red-300">{errorMessage}</p>}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-[#8E969F]">{t('loading')}</p>
        ) : activeHabits.length === 0 ? (
          <p className="text-sm text-[#B7BDC4]">
            {t('empty')}
          </p>
        ) : (
          activeHabits.map((habit) => (
            <div
              key={habit.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void toggleToday(habit)}
                  aria-label={habit.completed_today ? t('markOpen') : t('markDone')}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${
                    habit.completed_today ? 'border-[#58D7D4] bg-[#46C8C8] text-[#0B1118]' : 'border-white/20 text-[#6B7480]'
                  }`}
                >
                  {habit.completed_today ? '✓' : ''}
                </button>
                <div>
                  <p className="text-sm font-semibold text-[#F5F2EA]">{habit.name}</p>
                  <p className="text-xs text-[#8E969F]">
                    {habit.completed_today ? t('doneToday') : t('openToday')} · {t('streak')} {habit.current_streak}{' '}
                    {habit.current_streak === 1 ? t('day') : t('days')} · {t('rate7d')} {Math.round(habit.completion_rate_7d * 100)}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => void removeHabit(habit.id)}
                className="text-xs text-[#8E969F] underline hover:text-red-300"
              >
                {t('remove')}
              </button>
            </div>
          ))
        )}
      </div>
      <p className="mt-4 text-xs text-[#8E969F]">
        {t('footerNote')}
      </p>
    </article>
  );
}
