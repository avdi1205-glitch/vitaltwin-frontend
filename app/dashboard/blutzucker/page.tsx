'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import { useDashboardShell } from '../dashboard-shell';

type CgmReading = { timestamp: string; glucose_value: number; source?: string };

/**
 * Blutzucker & Ernährung — CGM-Import + Ernährungstagebuch. Lädt ausschließlich
 * die dafür nötigen Daten (CGM-Messwerte, nur wenn Premium) — keine
 * Twin-/Gewohnheiten-/Verlaufsdaten mehr, die hier nicht gebraucht werden.
 */
export default function BlutzuckerPage() {
  const router = useRouter();
  const t = useTranslations('blutzucker');
  const { profile, loadingProfile } = useDashboardShell();
  const [cgmData, setCgmData] = useState<CgmReading[]>([]);
  const [cgmUploading, setCgmUploading] = useState(false);
  const [cgmMessage, setCgmMessage] = useState('');
  const [nutritionForm, setNutritionForm] = useState({ meal_name: '', carbs: '', protein: '', fat: '', calories: '' });
  const [nutritionMessage, setNutritionMessage] = useState('');

  const loadCgm = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/api/health/cgm?days=7'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setCgmData(await response.json());
      }
    } catch {
      // Stiller Fehlschlag beim Nachladen — die Upload-Aktion selbst zeigt bei Bedarf eine Fehlermeldung.
    }
  }, []);

  useEffect(() => {
    if (!profile?.premium) return;
    const timer = window.setTimeout(() => {
      void loadCgm();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCgm, profile?.premium]);

  const handleCgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    setCgmUploading(true);
    setCgmMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(apiUrl('/api/health/cgm/upload-csv'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setCgmMessage(t('uploadSuccess', { count: data?.count ?? 0 }));
        void loadCgm();
      } else {
        setCgmMessage(`❌ ${data?.detail ?? t('uploadError')}`);
      }
    } catch {
      setCgmMessage(t('networkError'));
    } finally {
      setCgmUploading(false);
      e.target.value = '';
    }
  };

  const saveNutrition = async () => {
    setNutritionMessage('');
    if (!nutritionForm.meal_name.trim()) {
      setNutritionMessage(t('missingMeal'));
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/health/nutrition'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          meal_name: nutritionForm.meal_name.trim(),
          carbs: Number(nutritionForm.carbs) || 0,
          protein: Number(nutritionForm.protein) || 0,
          fat: Number(nutritionForm.fat) || 0,
          calories: Number(nutritionForm.calories) || 0,
        }),
      });

      if (response.ok) {
        setNutritionMessage(t('mealSaved'));
        setNutritionForm({ meal_name: '', carbs: '', protein: '', fat: '', calories: '' });
      } else {
        const data = await response.json().catch(() => null);
        setNutritionMessage(`❌ ${data?.detail ?? t('mealError')}`);
      }
    } catch {
      setNutritionMessage(t('networkError'));
    }
  };

  return (
    <section className="mt-8 scroll-mt-24">
      <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA] md:text-3xl">
        {t('title')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
        {t('intro')}
      </p>

      {!loadingProfile && profile && !profile.premium ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="font-[family-name:var(--font-serif-display)] text-lg font-semibold text-[#F5F2EA]">
            {t('premiumTitle')}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#B7BDC4]">
            {t('premiumText')}
          </p>
          <Link
            href="/preise"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            {t('premiumLink')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
              {t('cgmImportTitle')}
            </h3>
            <p className="mt-2 text-sm text-[#B7BDC4]">{t('cgmImportHint')}</p>

            <input
              type="file"
              accept=".csv"
              onChange={handleCgmUpload}
              disabled={cgmUploading}
              className="mt-4 mb-2 w-full text-sm text-[#B7BDC4] file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#F3C979] file:to-[#C9913D] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0B1118]"
            />

            {cgmUploading && <p className="text-sm text-[#58D7D4]">{t('processing')}</p>}
            {cgmMessage && <p className="mt-2 text-sm text-[#B7BDC4]">{cgmMessage}</p>}

            {cgmData.length > 0 && (
              <div className="mt-6 max-h-64 space-y-1 overflow-y-auto">
                <p className="mb-2 text-xs text-[#8E969F]">{t('readingsCount', { count: cgmData.length })}</p>
                {cgmData.slice(0, 12).map((r, i) => (
                  <div key={i} className="flex justify-between border-b border-white/10 py-1 text-sm">
                    <span className="text-[#B7BDC4]">{new Date(r.timestamp).toLocaleString('de-DE')}</span>
                    <span className="font-medium text-[#58D7D4]">{r.glucose_value} mg/dL</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
              {t('nutritionTitle')}
            </h3>

            <div className="mt-4 space-y-4">
              <input
                type="text"
                placeholder={t('mealPlaceholder')}
                value={nutritionForm.meal_name}
                onChange={(e) => setNutritionForm({ ...nutritionForm, meal_name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder={t('carbsPlaceholder')}
                  value={nutritionForm.carbs}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, carbs: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                />
                <input
                  type="number"
                  placeholder={t('proteinPlaceholder')}
                  value={nutritionForm.protein}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                />
                <input
                  type="number"
                  placeholder={t('fatPlaceholder')}
                  value={nutritionForm.fat}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                />
                <input
                  type="number"
                  placeholder={t('caloriesPlaceholder')}
                  value={nutritionForm.calories}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, calories: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-[#F5F2EA] placeholder:text-[#8E969F]"
                />
              </div>

              <button
                onClick={saveNutrition}
                className="w-full rounded-xl bg-gradient-to-r from-[#F3C979] to-[#C9913D] py-3 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('saveMeal')}
              </button>
              {nutritionMessage && <p className="text-sm text-[#B7BDC4]">{nutritionMessage}</p>}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
