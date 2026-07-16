'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

const WELLNESS_GOALS: { id: string; label: string }[] = [
  { id: 'besser_schlafen', label: 'Besser schlafen' },
  { id: 'mehr_bewegen', label: 'Mehr bewegen' },
  { id: 'stress_reduzieren', label: 'Stress reduzieren' },
  { id: 'gesuender_essen', label: 'Gesünder essen' },
  { id: 'gewicht_bewusst_verwalten', label: 'Gewicht bewusst verwalten' },
  { id: 'mehr_energie', label: 'Mehr Energie' },
  { id: 'bessere_erholung', label: 'Bessere Erholung' },
  { id: 'gesunde_gewohnheiten_aufbauen', label: 'Gesunde Gewohnheiten aufbauen' },
];

const STEP_LABELS = ['Willkommen', 'Persönliche Ziele', 'Alltag', 'Erste Gewohnheiten', 'Zusammenfassung'];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  const [goals, setGoals] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState('');
  const [movementDays, setMovementDays] = useState('');
  const [habitNames, setHabitNames] = useState<string[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      router.push('/?auth=login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const toggleGoal = (goalId: string) => {
    setGoals((current) => (current.includes(goalId) ? current.filter((g) => g !== goalId) : [...current, goalId]));
  };

  const addHabitDraft = () => {
    const trimmed = newHabitName.trim();
    if (!trimmed || habitNames.length >= 3) return;
    setHabitNames((current) => [...current, trimmed]);
    setNewHabitName('');
  };

  const goNext = () => setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const finishOnboarding = async () => {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      await fetch(apiUrl('/api/profile/me'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ wellness_goals: goals, onboarding_completed: true }),
      });

      if (sleepHours || movementDays) {
        await fetch(apiUrl('/api/profile/daily'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            sleep_hours: sleepHours ? Number(sleepHours) : null,
            movement_days_per_week: movementDays ? Number(movementDays) : null,
          }),
        });
      }

      for (const name of habitNames) {
        await fetch(apiUrl('/api/profile/habits'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, category: 'sonstiges', frequency: 'taeglich' }),
        });
      }

      router.push('/dashboard');
    } catch {
      setMessage('Speichern hat nicht ganz geklappt — du kannst alles jederzeit in deinem Profil nachtragen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EFE1] px-6 py-16 text-neutral-900">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Schritt {step + 1} von {STEP_LABELS.length}</span>
          <Link href="/profil" className="underline hover:text-black">Später im Profil bearbeiten</Link>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-8">
          {step === 0 && (
            <>
              <h1 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold">Willkommen bei VitalTwin</h1>
              <p className="mt-4 text-neutral-700">
                In wenigen kurzen Schritten richten wir deinen digitalen Wellness-Zwilling ein. Alles ist optional —
                du kannst jede Frage überspringen und später jederzeit in deinem Profil ändern.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold">Persönliche Ziele</h2>
              <p className="mt-2 text-sm text-neutral-600">Wähle, was dir wichtig ist (optional, Mehrfachauswahl).</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {WELLNESS_GOALS.map((goal) => (
                  <label key={goal.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                    <input type="checkbox" checked={goals.includes(goal.id)} onChange={() => toggleGoal(goal.id)} />
                    {goal.label}
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold">Dein Alltag</h2>
              <p className="mt-2 text-sm text-neutral-600">Optional — hilft uns, passendere Hinweise zu geben.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-neutral-700">Durchschnittliche Schlafdauer (Stunden)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-neutral-700">Bewegungstage pro Woche</span>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={movementDays}
                    onChange={(e) => setMovementDays(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold">Erste Gewohnheiten</h2>
              <p className="mt-2 text-sm text-neutral-600">Optional — füge bis zu 3 Gewohnheiten hinzu, mit denen du starten willst.</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="z. B. 20 Minuten spazieren"
                  className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
                />
                <button
                  onClick={addHabitDraft}
                  disabled={habitNames.length >= 3}
                  className="rounded-xl border border-neutral-900 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hinzufügen
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {habitNames.map((name) => (
                  <li key={name} className="rounded-xl border border-neutral-200 bg-[#F5EFE1] px-4 py-2 text-sm">
                    {name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold">Zusammenfassung</h2>
              <div className="mt-4 space-y-3 text-sm text-neutral-700">
                <p><span className="font-semibold text-neutral-900">Ziele:</span> {goals.length > 0 ? goals.map((g) => WELLNESS_GOALS.find((w) => w.id === g)?.label).join(', ') : 'übersprungen'}</p>
                <p><span className="font-semibold text-neutral-900">Schlaf:</span> {sleepHours ? `${sleepHours} Std.` : 'übersprungen'}</p>
                <p><span className="font-semibold text-neutral-900">Bewegungstage:</span> {movementDays || 'übersprungen'}</p>
                <p><span className="font-semibold text-neutral-900">Gewohnheiten:</span> {habitNames.length > 0 ? habitNames.join(', ') : 'übersprungen'}</p>
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                Du kannst alles jederzeit in deinem Profil anpassen.
              </p>
              {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            </>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="rounded-xl border border-neutral-300 px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Zurück
            </button>
            {step < STEP_LABELS.length - 1 ? (
              <button
                onClick={goNext}
                className="rounded-xl bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={finishOnboarding}
                disabled={saving}
                className="rounded-xl bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Speichere...' : 'Fertig'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
