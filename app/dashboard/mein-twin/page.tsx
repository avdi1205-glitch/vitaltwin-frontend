'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { apiUrl } from '@/lib/api';
import { DEFAULT_TWIN_FORM } from '@/lib/twin-defaults';
import DashboardAdvancedTwinOverview from '../../components/dashboard-advanced-twin-overview';
import DashboardTwinEvolution from '../../components/dashboard-twin-evolution';
import DashboardLifestyleSimulation from '../../components/dashboard-lifestyle-simulation';
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
  const t = useTranslations('meinTwin');
  const locale = useLocale();
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
      const res = await fetch(apiUrl(`/api/twin/calculate?locale=${locale}`), {
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
        setErrorMessage(detail || t('calcFailedError'));
        return;
      }

      setTwin(data as TwinResponse);
      if (!profile?.premium) {
        setProfile((current) => (current ? { ...current, starter_calc_remaining: 0 } : current));
      }
      if (token) void fetchLatest(token);
    } catch {
      setErrorMessage(t('calcUnavailableError'));
    } finally {
      setLoading(false);
    }
  }, [familyContext, fetchLatest, form, locale, profile, setProfile, t]);

  const displayedTwin: TwinResponse | null = twin ?? (latest
    ? {
      biologisches_alter: latest.biologisches_alter,
      differenz: latest.differenz,
      scenarios: {
        aktuell: latest.scenarios?.aktuell ?? latest.biologisches_alter,
        optimiert: latest.scenarios?.optimiert ?? latest.biologisches_alter,
        aggressiv: latest.scenarios?.aggressiv ?? latest.biologisches_alter,
      },
      methodik: { typ: t('wellnessOrientation'), hinweis: t('lastCalcHint') },
      marker_references: [],
      empfehlungen: [
        t('fallbackRec1'),
        t('fallbackRec2'),
      ],
    }
    : null);

  const submitFeedback = async () => {
    setFeedbackMessage('');
    if (feedbackText.trim().length < 5) {
      setFeedbackMessage(t('feedbackMinLength'));
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
        setFeedbackMessage(data?.detail ?? t('feedbackSendError'));
        return;
      }
      setFeedbackText('');
      setFeedbackScore(5);
      setFeedbackMessage(data?.message ?? t('feedbackThanksDefault'));
    } catch {
      setFeedbackMessage(t('feedbackUnavailable'));
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
              ? t('starterLimitUsed')
              : t('starterLimitAvailable')}
          </div>
        )}
        {!loadingProfile && profile && !profile.premium && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#F5F2EA]">
            {profile?.starter_calc_remaining === 0
              ? t('starterUsedNotice')
              : t('starterOnceNotice')}
          </div>
        )}

        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">{t('title')}</h1>
          <p className="mt-2 text-sm text-[#8E969F]">{t('subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldAge')}</span>
            <input
              type="number"
              value={form.age === 0 ? '' : form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldGender')}</span>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value="männlich">{t('genderMale')}</option>
              <option value="weiblich">{t('genderFemale')}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldHba1c')}</span>
            <input
              type="number"
              step="0.1"
              value={form.hba1c === 0 ? '' : form.hba1c}
              onChange={(e) => setForm({ ...form, hba1c: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldCrp')}</span>
            <input
              type="number"
              step="0.1"
              value={form.crp === 0 ? '' : form.crp}
              onChange={(e) => setForm({ ...form, crp: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldVitaminD')}</span>
            <input
              type="number"
              value={form.vitamin_d === 0 ? '' : form.vitamin_d}
              onChange={(e) => setForm({ ...form, vitamin_d: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldApob')}</span>
            <input
              type="number"
              value={form.apob === 0 ? '' : form.apob}
              onChange={(e) => setForm({ ...form, apob: e.target.value === '' ? 0 : Number(e.target.value) })}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowMoreMarkers((current) => !current)}
          className="mt-4 text-sm font-semibold text-[#B7BDC4] underline hover:text-[#58D7D4]"
        >
          {showMoreMarkers ? t('hideMoreMarkers') : t('showMoreMarkers')}
        </button>

        {showMoreMarkers && (
          <div className="mt-4 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{t('moreBloodValuesTitle')}</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldFastingGlucose')}</span>
                  <input
                    type="number"
                    value={form.fasting_glucose === 0 ? '' : form.fasting_glucose}
                    onChange={(e) => setForm({ ...form, fasting_glucose: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldHdl')}</span>
                  <input
                    type="number"
                    value={form.hdl === 0 ? '' : form.hdl}
                    onChange={(e) => setForm({ ...form, hdl: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldTriglycerides')}</span>
                  <input
                    type="number"
                    value={form.triglycerides === 0 ? '' : form.triglycerides}
                    onChange={(e) => setForm({ ...form, triglycerides: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldHomocysteine')}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.homocysteine === 0 ? '' : form.homocysteine}
                    onChange={(e) => setForm({ ...form, homocysteine: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldTsh')}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.tsh === 0 ? '' : form.tsh}
                    onChange={(e) => setForm({ ...form, tsh: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldFerritin')}</span>
                  <input
                    type="number"
                    value={form.ferritin === 0 ? '' : form.ferritin}
                    onChange={(e) => setForm({ ...form, ferritin: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldVitaminB12')}</span>
                  <input
                    type="number"
                    value={form.vitamin_b12 === 0 ? '' : form.vitamin_b12}
                    onChange={(e) => setForm({ ...form, vitamin_b12: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldOmega3')}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.omega3_index === 0 ? '' : form.omega3_index}
                    onChange={(e) => setForm({ ...form, omega3_index: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{t('vitalsOtherTitle')}</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldRestingHeartRate')}</span>
                  <input
                    type="number"
                    value={form.resting_heart_rate === 0 ? '' : form.resting_heart_rate}
                    onChange={(e) => setForm({ ...form, resting_heart_rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldBpSystolic')}</span>
                  <input
                    type="number"
                    value={form.blood_pressure_systolic === 0 ? '' : form.blood_pressure_systolic}
                    onChange={(e) => setForm({ ...form, blood_pressure_systolic: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldBpDiastolic')}</span>
                  <input
                    type="number"
                    value={form.blood_pressure_diastolic === 0 ? '' : form.blood_pressure_diastolic}
                    onChange={(e) => setForm({ ...form, blood_pressure_diastolic: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldWaist')}</span>
                  <input
                    type="number"
                    value={form.waist_circumference === 0 ? '' : form.waist_circumference}
                    onChange={(e) => setForm({ ...form, waist_circumference: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldSleepHours')}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.sleep_hours === 0 ? '' : form.sleep_hours}
                    onChange={(e) => setForm({ ...form, sleep_hours: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-[#B7BDC4]">{t('fieldGripStrength')}</span>
                  <input
                    type="number"
                    value={form.grip_strength === 0 ? '' : form.grip_strength}
                    onChange={(e) => setForm({ ...form, grip_strength: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-[#F5F2EA]">{t('familyContextTitle')}</p>
          <p className="mt-1 text-xs text-[#8E969F]">
            {t('familyContextHint')}
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
              {t('familyContextHeart')}
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
              {t('familyContextMetabolic')}
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
            ? t('calculating')
            : (loadingProfile || !profile)
              ? t('loadingProfile')
              : (!profile.premium && profile.starter_calc_remaining === 0)
                ? t('limitReached')
                : t('recalculate')}
        </button>

        {!loadingProfile && profile && !profile.premium && profile?.starter_calc_remaining === 1 && (
          <p className="mt-3 text-sm text-[#B7BDC4]">{t('starterOneCalcHint')}</p>
        )}

        {displayedTwin?.methodik && (
          <p className="mt-4 text-xs text-[#8E969F]">{t('methodikLabel')} {displayedTwin.methodik.typ} · {displayedTwin.methodik.hinweis}</p>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h2 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">{t('analysisTitle')}</h2>
          <p className="mt-2 text-sm text-[#8E969F]">{t('analysisSubtitle')}</p>

          {!loadingLatest && !displayedTwin && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-[#B7BDC4]">
              {!profile?.premium && profile?.starter_calc_remaining === 0
                ? t('emptyStarterUsed')
                : t('emptyFirstCalc')}
            </div>
          )}

          {displayedTwin && (
            <>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8E969F]">{t('atGlanceTitle')}</p>
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

              <p className="mt-6 font-[family-name:var(--font-serif-display)] text-5xl font-semibold text-[#F5F2EA]">{displayedTwin.biologisches_alter} {t('ageResultSuffix')}</p>
              <p className="mt-2 text-[#B7BDC4]">{t('deviationLabel')} {displayedTwin.differenz > 0 ? '+' : ''}{displayedTwin.differenz} {t('ageResultSuffix')}</p>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">{t('scenarioCurrent')}</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aktuell}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">{t('scenarioOptimized')}</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.optimiert}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-[#8E969F]">{t('scenarioAggressive')}</p>
                  <p className="mt-1 text-lg font-semibold text-[#F5F2EA]">{displayedTwin.scenarios.aggressiv}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('recommendationsTitle')}</h3>
          <ul className="mt-4 space-y-3 text-[#F5F2EA]">
            {(displayedTwin?.empfehlungen ?? [
              t('defaultRec1'),
              t('defaultRec2'),
              t('defaultRec3'),
            ]).map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {loadingProfile ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('wellnessScenariosTitle')}</h3>
            <p className="mt-2 text-sm text-[#8E969F]">{t('wellnessScenariosLoading')}</p>
          </div>
        ) : profile && (profile.plan === 'pro' || profile.plan === 'family') ? (
          <DashboardLifestyleSimulation />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('wellnessScenariosTitle')}</h3>
            <p className="mt-2 text-sm text-[#8E969F]">
              {t('wellnessScenariosProText')}
            </p>
            <a
              href="/preise"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
            >
              {t('viewPro')}
            </a>
          </div>
        )}

        <DashboardAdvancedTwinOverview />

        <DashboardTwinEvolution />

        <p className="-mt-2 text-sm text-[#B7BDC4]">
          <a href="/dashboard/verlauf" className="font-semibold text-[#58D7D4] underline hover:text-[#F3C979]">
            {t('trendsLink')}
          </a>
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('referencesTitle')}</h3>
          <p className="mt-2 text-sm text-[#8E969F]">{t('referencesSubtitle')}</p>

          {!loadingProfile && profile && !profile.premium && (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[#F5F2EA]">
              {t('referencesBetaNotice')}
            </p>
          )}

          {(profile?.premium && (!displayedTwin?.marker_references || displayedTwin.marker_references.length === 0)) && (
            <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-3 text-[#8E969F]">
              {t('referencesEmptyAfterCalc')}
            </p>
          )}

          {(profile?.premium && displayedTwin?.marker_references && displayedTwin.marker_references.length > 0) && (
            <div className="mt-4 space-y-3">
              {displayedTwin.marker_references.map((ref) => (
                <div key={ref.marker} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-sm font-semibold text-[#F5F2EA]">
                    {ref.marker.toUpperCase()} · {t('targetRangeLabel')} {ref.target_min ?? '-'} {t('toLabel')} {ref.target_max ?? '-'} {ref.unit}
                  </p>
                  <p className="mt-1 text-xs text-[#B7BDC4]">{t('populationLabel')} {ref.population_note} · {t('evidenceLabel')} {ref.evidence_level}</p>
                  <a href={ref.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#58D7D4] hover:underline">
                    {t('sourceLabel')} {ref.source_name}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="feedback" className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">{t('feedbackTitle')}</h3>
          <p className="mt-2 text-sm text-[#8E969F]">
            {t('feedbackIntro')}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
            <label className="text-sm text-[#B7BDC4]">{t('ratingLabel')}</label>
            <select
              value={feedbackScore}
              onChange={(e) => setFeedbackScore(Number(e.target.value))}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] focus:border-[#58D7D4] focus:outline-none"
            >
              <option value={5}>{t('rating5')}</option>
              <option value={4}>{t('rating4')}</option>
              <option value={3}>{t('rating3')}</option>
              <option value={2}>{t('rating2')}</option>
              <option value={1}>{t('rating1')}</option>
            </select>
          </div>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            placeholder={t('feedbackPlaceholder')}
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[#F5F2EA] placeholder:text-[#6B7480] focus:border-[#58D7D4] focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submitFeedback}
              disabled={sendingFeedback}
              className="rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sendingFeedback ? t('sendingFeedback') : t('sendFeedback')}
            </button>
            {feedbackMessage && <p className="text-sm text-[#B7BDC4]">{feedbackMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
