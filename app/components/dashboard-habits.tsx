'use client';

import { useEffect, useState } from 'react';

type Habit = {
  id: string;
  label: string;
  createdAt: string;
  completedDates: string[];
};

type DashboardHabitsProps = {
  /** Namespaces storage per account so one user never sees another user's
   * habits on a shared browser/device. */
  storageKey: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(completedDates: string[]): number {
  const dates = new Set(completedDates);
  let streak = 0;
  const cursor = new Date();

  // A streak counts consecutive days up to and including today. If today
  // isn't done yet, still count backwards from yesterday so an in-progress
  // streak isn't shown as broken before the day is over.
  if (!dates.has(todayKey())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function DashboardHabits({ storageKey }: DashboardHabitsProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fullKey = `vitaltwin_habits_${storageKey}`;

  useEffect(() => {
    // One-time client-side hydration from localStorage (an external system).
    try {
      const raw = window.localStorage.getItem(fullKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHabits(raw ? (JSON.parse(raw) as Habit[]) : []);
    } catch {
      setHabits([]);
    } finally {
      setHydrated(true);
    }
  }, [fullKey]);

  const persist = (next: Habit[]) => {
    setHabits(next);
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(next));
    } catch {
      // Storage unavailable (e.g. private mode quota) — keep working in-memory.
    }
  };

  const addHabit = () => {
    const label = newHabit.trim();
    if (!label) return;
    persist([
      ...habits,
      { id: `${Date.now()}`, label, createdAt: todayKey(), completedDates: [] },
    ]);
    setNewHabit('');
    setShowAddForm(false);
  };

  const toggleToday = (habitId: string) => {
    const today = todayKey();
    persist(
      habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const done = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: done
            ? habit.completedDates.filter((date) => date !== today)
            : [...habit.completedDates, today],
        };
      }),
    );
  };

  const removeHabit = (habitId: string) => {
    persist(habits.filter((habit) => habit.id !== habitId));
  };

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900">Gewohnheiten</h3>
        <button
          onClick={() => setShowAddForm((current) => !current)}
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Gewohnheit hinzufügen
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addHabit();
            }}
            placeholder="z. B. 20 Minuten spazieren"
            className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
          <button
            onClick={addHabit}
            className="rounded-xl border border-neutral-900 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
          >
            Speichern
          </button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {!hydrated ? (
          <p className="text-sm text-neutral-500">Lade Gewohnheiten...</p>
        ) : habits.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Noch keine Gewohnheiten angelegt. Füge deine erste Gewohnheit hinzu, um deine Serie zu starten.
          </p>
        ) : (
          habits.map((habit) => {
            const done = habit.completedDates.includes(todayKey());
            const streak = computeStreak(habit.completedDates);
            return (
              <div
                key={habit.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleToday(habit.id)}
                    aria-label={done ? 'Als offen markieren' : 'Als erledigt markieren'}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${
                      done ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-400'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{habit.label}</p>
                    <p className="text-xs text-neutral-500">
                      {done ? 'Heute erledigt' : 'Heute offen'} · Serie: {streak} {streak === 1 ? 'Tag' : 'Tage'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="text-xs text-neutral-400 underline hover:text-red-600"
                >
                  Entfernen
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        Gewohnheiten werden aktuell lokal auf diesem Gerät gespeichert.
      </p>
    </article>
  );
}
