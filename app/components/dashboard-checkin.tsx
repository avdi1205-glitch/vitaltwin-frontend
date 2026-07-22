'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

type CheckinEntry = {
  entry_date: string;
  mood?: number | null;
  energy?: number | null;
  stress?: number | null;
  motivation?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  movement_minutes?: number | null;
  recovery?: number | null;
  water_habit?: string | null;
  note?: string | null;
};

const SCALE_FIELDS: { key: keyof CheckinEntry; label: string }[] = [
  { key: 'mood', label: 'Stimmung' },
  { key: 'energy', label: 'Energie' },
  { key: 'stress', label: 'Stress' },
  { key: 'sleep_quality', label: 'Schlafqualität' },
];

const OPTIONAL_SCALE_FIELDS: { key: keyof CheckinEntry; label: string }[] = [
  { key: 'motivation', label: 'Motivation' },
  { key: 'recovery', label: 'Erholung' },
];

/**
 * Daily Check-in Loop (Twin Intelligence Core, Etappe 3 §1). Real backend
 * persistence via `/api/profile/daily` (upsert per local calendar day) —
 * no demo data, no invented defaults. Kept mobile-first and compact per
 * §8 ("Dashboard nicht überladen").
 */
export default function DashboardCheckin() {
  const [entry, setEntry] = useState<CheckinEntry>({ entry_date: new Date().toISOString().slice(0, 10) });
  const [hasSavedEntry, setHasSavedEntry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMore, setShowMore] = useState(false);

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/profile/daily/today'), { headers: authHeader() });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.item) {
          setEntry(data.item as CheckinEntry);
          setHasSavedEntry(true);
        }
      } catch {
        // Silently keep the empty form — not a blocking error for a first-time check-in.
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeader]);

  const updateField = (key: keyof CheckinEntry, value: string) => {
    setEntry((current) => ({
      ...current,
      [key]: value === '' ? null : Number.isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl('/api/profile/daily'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(entry),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = data?.detail;
        setErrorMessage(
          Array.isArray(detail) ? detail[0]?.msg ?? 'Check-in konnte nicht gespeichert werden.' : detail ?? 'Check-in konnte nicht gespeichert werden.',
        );
        return;
      }
      setHasSavedEntry(true);
      setMessage('Check-in gespeichert.');
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async () => {
    if (!window.confirm('Diesen heutigen Check-in wirklich löschen?')) return;
    setDeleting(true);
    setMessage('');
    setErrorMessage('');
    try {
      const response = await fetch(apiUrl(`/api/profile/daily/${entry.entry_date}`), {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.detail ?? 'Check-in konnte nicht gelöscht werden.');
        return;
      }
      setEntry({ entry_date: new Date().toISOString().slice(0, 10) });
      setHasSavedEntry(false);
      setMessage('Check-in gelöscht.');
    } catch {
      setErrorMessage('Backend gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-[#8E969F]">Lade heutigen Check-in...</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Check-in heute</h3>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#8E969F]">{entry.entry_date}</span>
      </div>
      <p className="mt-2 text-sm text-[#8E969F]">Freiwillig — lass Felder leer, die du heute nicht beantworten möchtest.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SCALE_FIELDS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs text-[#B7BDC4]">{label} (1-10)</span>
            <select
              value={entry[key] ?? ''}
              onChange={(e) => updateField(key, e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value="">–</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-xs text-[#B7BDC4]">Schlafdauer (Stunden)</span>
          <input
            type="number"
            step="0.5"
            min={0}
            max={16}
            value={entry.sleep_hours ?? ''}
            onChange={(e) => updateField('sleep_hours', e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[#B7BDC4]">Bewegung (Minuten)</span>
          <input
            type="number"
            min={0}
            max={1440}
            value={entry.movement_minutes ?? ''}
            onChange={(e) => updateField('movement_minutes', e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((current) => !current)}
        className="mt-3 text-xs font-semibold text-[#B7BDC4] underline hover:text-[#58D7D4]"
      >
        {showMore ? 'Weniger anzeigen' : 'Motivation, Erholung, Notiz (optional)'}
      </button>

      {showMore && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {OPTIONAL_SCALE_FIELDS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs text-[#B7BDC4]">{label} (1-10, optional)</span>
              <select
                value={entry[key] ?? ''}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
              >
                <option value="">–</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-xs text-[#B7BDC4]">Wasser (optional)</span>
            <select
              value={entry.water_habit ?? ''}
              onChange={(e) => setEntry((current) => ({ ...current, water_habit: e.target.value || null }))}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value="">–</option>
              <option value="wenig">Wenig</option>
              <option value="mittel">Mittel</option>
              <option value="viel">Viel</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-[#B7BDC4]">Notiz (optional, max. 280 Zeichen)</span>
            <input
              type="text"
              maxLength={280}
              value={entry.note ?? ''}
              onChange={(e) => setEntry((current) => ({ ...current, note: e.target.value }))}
              placeholder="Wie war dein Tag?"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Speichere...' : 'Check-in speichern'}
        </button>
        {hasSavedEntry && (
          <button
            onClick={() => void deleteEntry()}
            disabled={deleting}
            className="rounded-xl border border-red-400/25 px-5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {deleting ? 'Lösche...' : 'Eintrag löschen'}
          </button>
        )}
        {message && <p className="text-sm text-[#B7BDC4]">{message}</p>}
        {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
      </div>
    </article>
  );
}
