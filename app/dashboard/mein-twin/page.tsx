'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { DEFAULT_TWIN_FORM } from '@/lib/twin-defaults';
import { useDashboardShell } from '../dashboard-shell';

type TwinResponse = {
  biologisches_alter: number;
  differenz: number;
  scenarios: { aktuell: number; optimiert: number; aggressiv: number };
  methodik?: { typ: string; hinweis: string };
  marker_references?: MarkerReference[];
  empfehlungen: string[];
  familienkontext_hinweis?: string | null;
};

type MarkerReference = {
  marker: string;
  unit: string;
  target_min: number | null;
  target_max: number | null;
  warn_min: number | null;
  warn_max: number | null;
  source_name: string;
  source_url: string;
  evidence_level: string;
  population_note: string;
};

type HistoryItem = {
  id: number;
  created_at: string;
  biologisches_alter: number;
  differenz: number;
  scenarios?: { aktuell?: number; optimiert?: number; aggressiv?: number };
  hba1c: number;
  crp: number;
  vitamin_d: number;
  apob: number;
};

/**
 * Mein Twin: Marker-Eingabe, Twin-Berechnung, Analyse, Empfehlungen und
 * Referenzdaten aus der Twin-Auswertung selbst. Lädt nur den LETZTEN
 * gespeicherten Stand (limit=1) statt der vollen Historie — die vollständige
 * Liste lebt auf /dashboard/verlauf.
 */
export default function MeinTwinPage() {
  const { profile, loadingProfile, setProfile } = useDashboardShell();
  const [form, setForm] = useState({ ...DEFAULT_TWIN_FORM });
  const [showMoreMarkers, setShowMoreMarkers] = useState(false);
  const [familyContext, setFamilyContext] = useState<string[]>([]);
  const [twin, setTwin] = useState<TwinResponse | null>(null);
  const [latest, setLatest] = useState<HistoryItem | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchLatest = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiUrl('/api/twin/history?limit=1'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => null)) as { items?: HistoryItem[] } | null;
      if (response.ok) {
        setLatest(Array.isArray(data?.items) && data.items.length > 0 ? data.items[0] : null);
      }
    } catch {
      // Non-fatal — falls back to "Starte deine erste Berechnung".
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const timer = window.setTimeout(() => void fetchLatest(token), 0);
    return () => window.clearTimeout(timer);
  }, [fetchLatest]);

  const calculate = useCallback(async () => {
    setErrorMessage('');
    if (!profile) return;
    if (!profile.premium && profile.starter_calc_remaining === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/twin/calculate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, family_context: familyContext, token }),
      });

      const data = (await res.json().catch(() => null)) as TwinResponse | { detail?: string } | null;

      if (!res.ok) {
        const detail = data && 'detail' in data ? data.detail ?? '' : '';
        if (typeof detail === 'string' && detail.toLowerCase().includes('starter')) {
          return;
        }
        setErrorMessage(detail || 'Berechnung fehlgeschlagen.');
        return;
      }

      setTwin(data as TwinResponse);
      if (!profile?.premium) {
        setProfile((current) => (current ? { ...current, starter_calc_remaining: 0 } : current));
      }
      if (token) void fetchLatest(token);
    } catch {
      setErrorMessage('Berechnung aktuell nicht verfügbar. Bitte prüfe die API-Verbindung.');
    } finally {
      setLoading(false);
    }
  }, [familyContext, fetchLatest, form, profile, setProfile]);

  const displayedTwin: TwinResponse | null = twin ?? (latest
    ? {
      biologisches_alter: latest.biologisches_alter,
      differenz: latest.differenz,
      scenarios: {
        aktuell: latest.scenarios?.aktuell ?? latest.biologisches_alter,
        optimiert: latest.scenarios?.optimiert ?? latest.biologisches_alter,
        aggressiv: latest.scenarios?.aggressiv ?? latest.biologisches_alter,
      },
      methodik: { typ: 'Wellness-Orientierung', hinweis: 'Angezeigt wird deine letzte gespeicherte Berechnung.' },
      marker_references: [],
      empfehlungen: [
        'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
        'Kontrolliere deine Marker regelmäßig für bessere Vergleichbarkeit.',
      ],
    }
    : null);

  const submitFeedback = async () => {
    setFeedbackMessage('');
    if (feedbackText.trim().length < 5) {
      setFeedbackMessage('Bitte gib mindestens 5 Zeichen Feedback ein.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setSendingFeedback(true);
    try {
      const response = await fetch(apiUrl('/api/users/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: feedbackScore, message: feedbackText.trim(), source: 'dashboard' }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFeedbackMessage(data?.detail ?? 'Feedback konnte nicht gesendet werden.');
        return;
      }
      setFeedbackText('');
      setFeedbackScore(5);
      setFeedbackMessage(data?.message ?? 'Danke für dein Feedback!');
    } catch {
      setFeedbackMessage('Feedback-Service gerade nicht erreichbar. Bitte später erneut versuchen.');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] scroll-mt-24">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
        {!loadingProfile && profile && !profile.premium && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#F5F2EA]">
            {profile?.starter_calc_remaining === 0
              ? 'Starter-Limit: 1 von 1 Berechnung wurde bereits genutzt.'
              : 'Starter-Limit: Du hast genau 1 von 1 Berechnung verfügbar.'}
          </div>
        )}
        {!loadingProfile && profile && !profile.premium && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#F5F2EA]">
            {profile?.starter_calc_remaining === 0
              ? 'Deine einmalige Starter-Berechnung wurde bereits genutzt. Für weitere Berechnungen, Verlauf und Detailquellen aktiviere den Beta-Zugang.'
              : 'Starter enthält eine einmalige Twin-Berechnung mit Basis-Empfehlungen. Für Verlauf, Detailquellen und unbegrenzte Simulationen aktiviere den Beta-Zugang.'}
          </div>
        )}

        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Marker-Eingabe</h1>
          <p className="mt-2 text-sm text-[#8E969F]">Aktualisiere deine Biomarker und starte eine neue Twin-Berechnung.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">Alter</span>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">Geschlecht</span>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value="männlich">Männlich</option>
              <option value="weiblich">Weiblich</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">HbA1c</span>
            <input
              type="number"
              step="0.1"
              value={form.hba1c}
              onChange={(e) => setForm({ ...form, hba1c: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">CRP</span>
            <input
              type="number"
              step="0.1"
              value={form.crp}
              onChange={(e) => setForm({ ...form, crp: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">Vitamin D</span>
            <input
              type="number"
              value={form.vitamin_d}
              onChange={(e) => setForm({ ...form, vitamin_d: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">ApoB</span>
            <input
              type="number"
              value={form.apob}
              onChange={(e) => setForm({ ...form, apob: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreMarkers((current) => !current)}
          className="mt-4 text-sm font-semibold text-[#B7BDC4] underline hover:text-[#58D7D4]"
        >
          {showMoreMarkers ? 'Weitere Marker ausblenden' : 'Weitere Marker anzeigen (optional)'}
        </button>

        {showMoreMarkers && (
          <div className="mt-4 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Weitere Blutwerte</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Nüchternglukose (mg/dL)</span>
                  <input
                    type="number"
                    value={form.fasting_glucose}
                    onChange={(e) => setForm({ ...form, fasting_glucose: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">HDL-Cholesterin (mg/dL)</span>
                  <input
                    type="number"
                    value={form.hdl}
                    onChange={(e) => setForm({ ...form, hdl: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Triglyceride (mg/dL)</span>
                  <input
                    type="number"
                    value={form.triglycerides}
                    onChange={(e) => setForm({ ...form, triglycerides: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Homocystein (µmol/L)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.homocysteine}
                    onChange={(e) => setForm({ ...form, homocysteine: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">TSH (mIU/L)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.tsh}
                    onChange={(e) => setForm({ ...form, tsh: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Ferritin (ng/mL)</span>
                  <input
                    type="number"
                    value={form.ferritin}
                    onChange={(e) => setForm({ ...form, ferritin: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Vitamin B12 (pg/mL)</span>
                  <input
                    type="number"
                    value={form.vitamin_b12}
                    onChange={(e) => setForm({ ...form, vitamin_b12: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Omega-3-Index (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.omega3_index}
                    onChange={(e) => setForm({ ...form, omega3_index: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Vitalwerte &amp; Sonstiges</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Ruhepuls (bpm)</span>
                  <input
                    type="number"
                    value={form.resting_heart_rate}
                    onChange={(e) => setForm({ ...form, resting_heart_rate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Blutdruck systolisch (mmHg)</span>
                  <input
                    type="number"
                    value={form.blood_pressure_systolic}
                    onChange={(e) => setForm({ ...form, blood_pressure_systolic: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Blutdruck diastolisch (mmHg)</span>
                  <input
                    type="number"
                    value={form.blood_pressure_diastolic}
                    onChange={(e) => setForm({ ...form, blood_pressure_diastolic: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Taillenumfang (cm)</span>
                  <input
                    type="number"
                    value={form.waist_circumference}
                    onChange={(e) => setForm({ ...form, waist_circumference: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Schlafdauer (h/Nacht)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.sleep_hours}
                    onChange={(e) => setForm({ ...form, sleep_hours: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">Griffkraft (kg)</span>
                  <input
                    type="number"
                    value={form.grip_strength}
                    onChange={(e) => setForm({ ...form, grip_strength: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-[#F5F2EA]">Familienkontext (optional)</p>
          <p className="mt-1 text-xs text-[#8E969F]">
            Rein für die Priorisierung deiner Wellness-Empfehlungen &mdash; keine Diagnose, keine Risikoeinstufung.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#F5F2EA]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={familyContext.includes('herz_kreislauf')}
                onChange={(e) =>
                  setFamilyContext((current) =>
                    e.target.checked ? [...current, 'herz_kreislauf'] : current.filter((item) => item !== 'herz_kreislauf'),
                  )
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#58D7D4]"
              />
              Herz-Kreislauf in der Familie
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={familyContext.includes('stoffwechsel')}
                onChange={(e) =>
                  setFamilyContext((current) =>
                    e.target.checked ? [...current, 'stoffwechsel'] : current.filter((item) => item !== 'stoffwechsel'),
                  )
                }
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#58D7D4]"
              />
              Stoffwechsel/Diabetes in der Familie
            </label>
          </div>
        </div>

        {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}

        <button
          onClick={calculate}
          disabled={loading || loadingProfile || !profile || (!profile.premium && profile.starter_calc_remaining === 0)}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-4 text-lg font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading
            ? 'Berechne Twin...'
            : (loadingProfile || !profile)
              ? 'Profil wird geladen...'
              : (!profile.premium && profile.starter_calc_remaining === 0)
                ? 'Starter-Limit erreicht'
                : 'Twin neu berechnen'}
        </button>

        {!loadingProfile && profile && !profile.premium && profile?.starter_calc_remaining === 1 && (
          <p className="mt-3 text-sm text-[#B7BDC4]">Hinweis: Im Starter ist genau eine Berechnung möglich.</p>
        )}

        {displayedTwin?.methodik && (
          <p className="mt-4 text-xs text-[#8E969F]">Methodik: {displayedTwin.methodik.typ} · {displayedTwin.methodik.hinweis}</p>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">Analyse</h2>
          <p className="mt-2 text-sm text-[#8E969F]">Deine aktuelle Auswertung inklusive Vergleichsszenarien.</p>

          {!loadingLatest && !displayedTwin && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-[#B7BDC4]">
              {!profile?.premium && profile?.starter_calc_remaining === 0
                ? 'Starter-Berechnung bereits genutzt. Aktiviere den Beta-Zugang, um hier wieder Ergebnisse und Szenarien zu sehen.'
                : 'Starte deine erste Berechnung, um hier Ergebnisse und Szenarien zu sehen.'}
            </div>
          )}

          {displayedTwin && (
            <>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">Auf einen Blick</p>
                <ul className="mt-3 space-y-2 text-sm text-[#F5F2EA]">
                  {displayedTwin.empfehlungen.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[#58D7D4]">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {displayedTwin.familienkontext_hinweis && (
                  <p className="mt-3 text-xs text-[#8E969F]">{displayedTwin.familienkontext_hinweis}</p>
                )}
              </div>

              <p className="mt-6 font-[family-name:var(--font-serif-display)] text-5xl font-semibold text-[#F5F2EA]">{displayedTwin.biologisches_alter} Jahre</p>
              <p className="mt-2 text-[#B7BDC4]">Abweichung vom chronologischen Alter: {displayedTwin.differenz > 0 ? '+' : ''}{displayedTwin.differenz} Jahre</p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">Aktuell</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aktuell}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">Optimiert</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.optimiert}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">Aggressiv</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aggressiv}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Empfehlungen</h3>
          <ul className="mt-4 space-y-3 text-[#F5F2EA]">
            {(displayedTwin?.empfehlungen ?? [
              'Schließe eine Berechnung ab, um personalisierte Empfehlungen zu erhalten.',
              'Achte auf Schlaf, Stressmanagement und regelmäßige Bewegung.',
              'Kontrolliere Marker regelmäßig und tracke Verbesserungen im Dashboard.',
            ]).map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Referenzdaten & Quellen</h3>
          <p className="mt-2 text-sm text-[#8E969F]">Transparente Referenzbereiche aus veröffentlichten Leitlinien und Fachquellen.</p>

          {!loadingProfile && profile && !profile.premium && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[#F5F2EA]">
              Detailquellen sind im Beta-Zugang verfügbar.
            </p>
          )}

          {(profile?.premium && (!displayedTwin?.marker_references || displayedTwin.marker_references.length === 0)) && (
            <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
              Referenzdaten werden nach der ersten Berechnung angezeigt.
            </p>
          )}

          {(profile?.premium && displayedTwin?.marker_references && displayedTwin.marker_references.length > 0) && (
            <div className="mt-4 space-y-3">
              {displayedTwin.marker_references.map((ref) => (
                <div key={ref.marker} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-sm font-semibold text-[#F5F2EA]">
                    {ref.marker.toUpperCase()} · Zielbereich {ref.target_min ?? '-'} bis {ref.target_max ?? '-'} {ref.unit}
                  </p>
                  <p className="mt-1 text-xs text-[#B7BDC4]">Population: {ref.population_note} · Evidenz: {ref.evidence_level}</p>
                  <a href={ref.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#58D7D4] hover:underline">
                    Quelle: {ref.source_name}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">Feedback zur Beta</h3>
          <p className="mt-2 text-sm text-[#8E969F]">
            Was war hilfreich und was sollten wir verbessern? Dein Feedback fließt direkt in die nächsten Releases.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
            <label className="text-sm text-[#B7BDC4]">Bewertung (1-5)</label>
            <select
              value={feedbackScore}
              onChange={(e) => setFeedbackScore(Number(e.target.value))}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value={5}>5 - Sehr gut</option>
              <option value={4}>4 - Gut</option>
              <option value={3}>3 - Okay</option>
              <option value={2}>2 - Schwach</option>
              <option value={1}>1 - Schlecht</option>
            </select>
          </div>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            placeholder="Z. B. 'Simulation ist stark, aber ich wünsche mir mehr Erklärung zu Marker X.'"
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submitFeedback}
              disabled={sendingFeedback}
              className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sendingFeedback ? 'Sende...' : 'Feedback senden'}
            </button>
            {feedbackMessage && <p className="text-sm text-[#B7BDC4]">{feedbackMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
