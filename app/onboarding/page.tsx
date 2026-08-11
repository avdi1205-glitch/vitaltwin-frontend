'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import VitalTwinMark from '../components/brand/VitalTwinMark';

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
  const [completed, setCompleted] = useState(false);

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

      setCompleted(true);
    } catch {
      setMessage('Speichern hat nicht ganz geklappt — du kannst alles jederzeit in deinem Profil nachtragen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] px-6 py-16 text-[#F5F2EA]">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-xs text-[#8E969F]">
          <span>Schritt {step + 1} von {STEP_LABELS.length}</span>
          <Link href="/profil" className="underline hover:text-[#58D7D4]">Später im Profil bearbeiten</Link>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#F3C979] to-[#58D7D4] transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          {step === 0 && (
            <div className="relative -m-8 overflow-hidden rounded-3xl bg-[#0B1118] px-6 py-14 text-center sm:px-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 55% 55% at 15% 20%, rgba(232,181,93,0.16), transparent 60%), radial-gradient(ellipse 55% 55% at 85% 80%, rgba(70,200,200,0.16), transparent 60%)',
                }}
              />
              <div className="relative">
                <VitalTwinMark variant="icon" theme="dark" className="mx-auto h-9 w-auto" />
                <h1 className="mt-6 font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] sm:text-4xl">
                  Triff deinen Zwilling
                </h1>
                <p className="mt-3 font-[family-name:var(--font-mono-technical)] text-xs font-medium uppercase tracking-[0.35em] text-[#8E969F]">
                  Menschliche Intuition. Digitale Präzision.
                </p>
                <p className="mx-auto mt-5 max-w-md text-sm text-[#B7BDC4]">
                  In wenigen kurzen Schritten richten wir deinen digitalen Wellness-Zwilling ein. Alles ist optional —
                  du kannst jede Frage überspringen und später jederzeit in deinem Profil ändern.
                </p>
                <button
                  onClick={goNext}
                  className="mt-8 rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-8 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
                >
                  Los geht&apos;s
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Persönliche Ziele</h2>
              <p className="mt-2 text-sm text-[#B7BDC4]">Wähle, was dir wichtig ist (optional, Mehrfachauswahl).</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {WELLNESS_GOALS.map((goal) => (
                  <label key={goal.id} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-[#F5F2EA]">
                    <input type="checkbox" checked={goals.includes(goal.id)} onChange={() => toggleGoal(goal.id)} className="accent-[#58D7D4]" />
                    {goal.label}
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Dein Alltag</h2>
              <p className="mt-2 text-sm text-[#B7BDC4]">Optional — hilft uns, passendere Hinweise zu geben.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Durchschnittliche Schlafdauer (Stunden)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Bewegungstage pro Woche</span>
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={movementDays}
                    onChange={(e) => setMovementDays(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Erste Gewohnheiten</h2>
              <p className="mt-2 text-sm text-[#B7BDC4]">Optional — füge bis zu 3 Gewohnheiten hinzu, mit denen du starten willst.</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="z. B. 20 Minuten spazieren"
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                />
                <button
                  onClick={addHabitDraft}
                  disabled={habitNames.length >= 3}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hinzufügen
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {habitNames.map((name) => (
                  <li key={name} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-[#F5F2EA]">
                    {name}
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 4 && !completed && (
            <>
              <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Zusammenfassung</h2>
              <div className="mt-4 space-y-3 text-sm text-[#B7BDC4]">
                <p><span className="font-semibold text-[#F5F2EA]">Ziele:</span> {goals.length > 0 ? goals.map((g) => WELLNESS_GOALS.find((w) => w.id === g)?.label).join(', ') : 'übersprungen'}</p>
                <p><span className="font-semibold text-[#F5F2EA]">Schlaf:</span> {sleepHours ? `${sleepHours} Std.` : 'übersprungen'}</p>
                <p><span className="font-semibold text-[#F5F2EA]">Bewegungstage:</span> {movementDays || 'übersprungen'}</p>
                <p><span className="font-semibold text-[#F5F2EA]">Gewohnheiten:</span> {habitNames.length > 0 ? habitNames.join(', ') : 'übersprungen'}</p>
              </div>
              <p className="mt-4 text-xs text-[#8E969F]">
                Du kannst alles jederzeit in deinem Profil anpassen.
              </p>
              {message && <p className="mt-3 text-sm text-red-300">{message}</p>}
            </>
          )}

          {completed && (() => {
            const hasStartedData = Boolean(sleepHours || movementDays || habitNames.length > 0);
            const primaryAction = hasStartedData
              ? { label: 'Frag deinen Twin', href: '/frag-deinen-twin' }
              : { label: 'Ersten Check-in machen', href: '/dashboard/gewohnheiten' };
            return (
              <div className="text-center">
                <VitalTwinMark variant="icon" theme="dark" className="mx-auto h-9 w-auto" />
                <h2 className="mt-5 font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Dein Twin ist bereit</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-[#B7BDC4]">
                  Dein Twin startet jetzt mit dem, was du ihm gegeben hast — und wird mit jedem Check-in, verbundenen
                  Datenpunkt und Feedback persönlicher.
                </p>
                <Link
                  href={primaryAction.href}
                  className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-8 py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
                >
                  {primaryAction.label}
                </Link>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Link href="/dashboard/gesundheitsdaten" className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60">
                    Gesundheitsdaten verbinden
                  </Link>
                  <Link href="/dashboard/mein-twin" className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60">
                    Mein Twin ansehen
                  </Link>
                </div>
                <Link href="/dashboard" className="mt-5 inline-block text-xs text-[#8E969F] underline hover:text-[#58D7D4]">
                  Später zum Dashboard
                </Link>
              </div>
            );
          })()}

          {step > 0 && !completed && (
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button
                onClick={goBack}
                disabled={step === 0}
                className="rounded-xl border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Zurück
              </button>
              {step < STEP_LABELS.length - 1 ? (
                <button
                  onClick={goNext}
                  className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
                >
                  Weiter
                </button>
              ) : (
                <button
                  onClick={finishOnboarding}
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-6 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Speichere...' : 'Fertig'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
