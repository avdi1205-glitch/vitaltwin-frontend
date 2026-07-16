'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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

const HABIT_CATEGORIES = ['schlaf', 'bewegung', 'ernaehrung', 'stress', 'energie', 'erholung', 'sonstiges'];
const HABIT_FREQUENCIES: { id: string; label: string }[] = [
  { id: 'taeglich', label: 'Täglich' },
  { id: 'mehrmals_woche', label: 'Mehrmals pro Woche' },
  { id: 'woechentlich', label: 'Wöchentlich' },
];

type Profile = {
  email: string;
  display_name: string | null;
  birth_year: number | null;
  age_group: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_language: string;
  timezone: string;
  unit_system: string;
  wellness_goals: string[];
  onboarding_completed: boolean;
  updated_at: string | null;
  deletion_requested_at: string | null;
};

type Habit = {
  id: string;
  name: string;
  category: string;
  frequency: string;
  target: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  active: boolean;
};

export default function Profil() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [language, setLanguage] = useState('de');
  const [tz, setTz] = useState('Europe/Berlin');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [goals, setGoals] = useState<string[]>([]);

  const [sleepHours, setSleepHours] = useState('');
  const [movementDays, setMovementDays] = useState('');
  const [steps, setSteps] = useState('');
  const [stressLevel, setStressLevel] = useState('3');
  const [energyLevel, setEnergyLevel] = useState('3');
  const [dailyMessage, setDailyMessage] = useState('');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('sonstiges');
  const [habitFrequency, setHabitFrequency] = useState('taeglich');
  const [habitTarget, setHabitTarget] = useState('');
  const [habitMessage, setHabitMessage] = useState('');

  const [exportMessage, setExportMessage] = useState('');
  const [deletionMessage, setDeletionMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(apiUrl('/api/profile/me'), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        router.push('/?auth=login');
        return;
      }
      const data = (await res.json().catch(() => null)) as Profile | null;
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name ?? '');
        setBirthYear(data.birth_year ? String(data.birth_year) : '');
        setGender(data.gender ?? '');
        setHeightCm(data.height_cm ? String(data.height_cm) : '');
        setWeightKg(data.weight_kg ? String(data.weight_kg) : '');
        setLanguage(data.preferred_language ?? 'de');
        setTz(data.timezone ?? 'Europe/Berlin');
        setUnitSystem(data.unit_system ?? 'metric');
        setGoals(data.wellness_goals ?? []);
      }
    } catch {
      setErrorMessage('Profil konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadHabits = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(apiUrl('/api/profile/habits'), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = (await res.json().catch(() => null)) as { items?: Habit[] } | null;
      setHabits(data?.items ?? []);
    } catch {
      setHabits([]);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/?auth=login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile(token);
    void loadHabits(token);
  }, [token, loadProfile, loadHabits, router]);

  const toggleGoal = (goalId: string) => {
    setGoals((current) => (current.includes(goalId) ? current.filter((g) => g !== goalId) : [...current, goalId]));
  };

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(apiUrl('/api/profile/me'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          display_name: displayName || null,
          birth_year: birthYear ? Number(birthYear) : null,
          gender: gender || null,
          height_cm: heightCm ? Number(heightCm) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          preferred_language: language,
          timezone: tz,
          unit_system: unitSystem,
          wellness_goals: goals,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(data?.detail ?? 'Profil konnte nicht gespeichert werden.');
        return;
      }
      setProfile(data);
      setMessage('Profil gespeichert.');
    } catch {
      setErrorMessage('Backend nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const saveDaily = async () => {
    if (!token) return;
    setDailyMessage('');
    try {
      const res = await fetch(apiUrl('/api/profile/daily'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sleep_hours: sleepHours ? Number(sleepHours) : null,
          movement_days_per_week: movementDays ? Number(movementDays) : null,
          steps: steps ? Number(steps) : null,
          stress_level: Number(stressLevel),
          energy_level: Number(energyLevel),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setDailyMessage(data?.detail ?? 'Konnte nicht gespeichert werden.');
        return;
      }
      setDailyMessage('Heutiger Alltag gespeichert.');
    } catch {
      setDailyMessage('Backend gerade nicht erreichbar.');
    }
  };

  const addHabit = async () => {
    if (!token || !habitName.trim()) return;
    setHabitMessage('');
    try {
      const res = await fetch(apiUrl('/api/profile/habits'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: habitName.trim(),
          category: habitCategory,
          frequency: habitFrequency,
          target: habitTarget || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setHabitMessage(data?.detail ?? 'Gewohnheit konnte nicht angelegt werden.');
        return;
      }
      setHabitName('');
      setHabitTarget('');
      void loadHabits(token);
    } catch {
      setHabitMessage('Backend gerade nicht erreichbar.');
    }
  };

  const toggleHabitActive = async (habit: Habit) => {
    if (!token) return;
    try {
      await fetch(apiUrl(`/api/profile/habits/${habit.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !habit.active }),
      });
      void loadHabits(token);
    } catch {
      // best effort
    }
  };

  const removeHabit = async (habitId: string) => {
    if (!token) return;
    try {
      await fetch(apiUrl(`/api/profile/habits/${habitId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      void loadHabits(token);
    } catch {
      // best effort
    }
  };

  const exportData = async () => {
    if (!token) return;
    setExportMessage('Export wird vorbereitet...');
    try {
      const res = await fetch(apiUrl('/api/profile/export'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setExportMessage('Export fehlgeschlagen.');
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vitaltwin-daten-export.json';
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage('Export heruntergeladen.');
    } catch {
      setExportMessage('Export gerade nicht möglich.');
    }
  };

  const requestDeletion = async () => {
    if (!token) return;
    setDeletionMessage('');
    try {
      const res = await fetch(apiUrl('/api/profile/request-deletion'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      setDeletionMessage(data?.message ?? 'Anfrage gesendet.');
    } catch {
      setDeletionMessage('Anfrage gerade nicht möglich. Schreib uns direkt an info@vitaltwin.de.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE1] px-6 py-16 text-center text-neutral-600">
        Profil wird geladen...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFE1] px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-500">VitalTwin</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif-display)] text-4xl font-semibold">Dein Profil</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Zuletzt geändert: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString('de-DE') : 'noch nie'}
        </p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm font-semibold text-neutral-900 underline hover:text-black">
          Zurück zum Dashboard
        </Link>

        {message && <p className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">{message}</p>}
        {errorMessage && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

        {/* Grundprofil */}
        <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Grundprofil</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Anzeigename</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Geburtsjahr (optional)</span>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="z. B. 1985"
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">
                Geschlecht (optional)
                <span className="block text-xs font-normal text-neutral-500">
                  Nur zur Priorisierung passender Wellness-Hinweise — keine Pflichtangabe.
                </span>
              </span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              >
                <option value="">Keine Angabe</option>
                <option value="weiblich">Weiblich</option>
                <option value="maennlich">Männlich</option>
                <option value="divers">Divers</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Einheitensystem</span>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              >
                <option value="metric">Metrisch (cm, kg)</option>
                <option value="imperial">Imperial (ft, lb)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Größe (cm, optional)</span>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Gewicht (kg, optional)</span>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Sprache</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Zeitzone</span>
              <input
                type="text"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* Wellness-Ziele */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Wellness-Ziele</h2>
          <p className="mt-2 text-sm text-neutral-600">Mehrfachauswahl möglich.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {WELLNESS_GOALS.map((goal) => (
              <label key={goal.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={goals.includes(goal.id)} onChange={() => toggleGoal(goal.id)} />
                {goal.label}
              </label>
            ))}
          </div>
        </section>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Speichere...' : 'Profil speichern'}
        </button>

        {/* Alltag */}
        <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Alltag (heute)</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Schlafdauer (Stunden, optional)</span>
              <input
                type="number"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Bewegungstage pro Woche (optional)</span>
              <input
                type="number"
                min={0}
                max={7}
                value={movementDays}
                onChange={(e) => setMovementDays(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Schritte heute (optional)</span>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Stress-Selbsteinschätzung (1-5)</span>
              <select
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-neutral-700">Energie-Selbsteinschätzung (1-5)</span>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={saveDaily}
            className="mt-4 rounded-xl border border-neutral-900 px-5 py-2 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
          >
            Heutigen Alltag speichern
          </button>
          {dailyMessage && <p className="mt-2 text-sm text-neutral-700">{dailyMessage}</p>}
        </section>

        {/* Gewohnheiten */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Gewohnheiten</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Name, z. B. 20 Min. spazieren"
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
            />
            <select
              value={habitCategory}
              onChange={(e) => setHabitCategory(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
            >
              {HABIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={habitFrequency}
              onChange={(e) => setHabitFrequency(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
            >
              {HABIT_FREQUENCIES.map((freq) => (
                <option key={freq.id} value={freq.id}>{freq.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={habitTarget}
              onChange={(e) => setHabitTarget(e.target.value)}
              placeholder="Ziel (optional)"
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <button
            onClick={addHabit}
            className="mt-3 rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Gewohnheit hinzufügen
          </button>
          {habitMessage && <p className="mt-2 text-sm text-red-600">{habitMessage}</p>}

          <div className="mt-5 space-y-2">
            {habits.length === 0 && <p className="text-sm text-neutral-600">Noch keine Gewohnheiten angelegt.</p>}
            {habits.map((habit) => (
              <div key={habit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-neutral-900">{habit.name}</p>
                  <p className="text-xs text-neutral-500">
                    {habit.category} · {habit.frequency} {habit.target ? `· Ziel: ${habit.target}` : ''} ·{' '}
                    {habit.active ? 'aktiv' : 'inaktiv'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleHabitActive(habit)} className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold">
                    {habit.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button onClick={() => removeHabit(habit.id)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600">
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Datenschutzkontrollen */}
        <section className="mt-6 rounded-3xl border border-neutral-200 bg-white p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold">Datenschutzkontrollen</h2>
          <p className="mt-3 text-sm text-neutral-700">
            Bei dir gespeichert: Grundprofil, Wellness-Ziele, tägliche Alltagswerte und Gewohnheiten — jeweils
            ausschließlich verknüpft mit deinem Konto. Keine medizinischen Diagnosen, keine Genetik- oder Laborwerte.
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Zuletzt geändert: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString('de-DE') : 'noch nie'}
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Bearbeiten kannst du deine Daten jederzeit direkt auf dieser Seite.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={exportData}
              className="rounded-xl border border-neutral-900 px-5 py-2 text-sm font-semibold transition hover:bg-neutral-900 hover:text-white"
            >
              Meine Daten exportieren
            </button>
            <button
              onClick={requestDeletion}
              className="rounded-xl border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Löschung von Konto/Daten anfordern
            </button>
          </div>
          {exportMessage && <p className="mt-2 text-sm text-neutral-700">{exportMessage}</p>}
          {deletionMessage && <p className="mt-2 text-sm text-neutral-700">{deletionMessage}</p>}
          <p className="mt-3 text-xs text-neutral-500">
            Aus Sicherheitsgründen wird eine Löschung manuell geprüft und nicht automatisch sofort ausgeführt. Du
            erreichst uns jederzeit auch direkt unter info@vitaltwin.de.
          </p>
        </section>
      </div>
    </div>
  );
}
