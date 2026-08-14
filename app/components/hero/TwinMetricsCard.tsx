'use client';

import { useTranslations } from 'next-intl';
import { AI_METRICS, WELLNESS_SCORE, WELLNESS_SCORE_MAX } from './heroData';
import WellnessScoreRing from './WellnessScoreRing';

const METRIC_LABEL_KEY = {
  hrv: 'metricHrv',
  sleepQuality: 'metricSleepQuality',
  regeneration: 'metricRegeneration',
  trend: 'metricTrend',
} as const;

/**
 * Right "DEIN KI-ZWILLING" (AI) column of the hero: teal-accented card with
 * the wellness-score ring and derived stats (demo values on the public page).
 */
export default function TwinMetricsCard() {
  const t = useTranslations('hero');

  return (
    <div className="min-w-0">
      <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">
        {t('twinTitle')}
      </h2>
      <div className="mt-2 h-px w-10 bg-[#46C8C8]" />
      <p className="mt-4 text-sm leading-relaxed text-[#B7BDC4]">
        {t('twinTagline1')}
        <br />
        {t('twinTagline2')}
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-[#8E969F]">{t('exampleValues')}</p>
        <div className="flex justify-center pb-4">
          <WellnessScoreRing score={WELLNESS_SCORE} max={WELLNESS_SCORE_MAX} label={t('wellnessScoreLabel')} ofLabel={t('ofLabel')} />
        </div>
        <div className="divide-y divide-white/5 border-t border-white/5">
          {AI_METRICS.map((metric) => (
            <div key={metric.id} className="flex items-center gap-3 py-3">
              <span className="text-lg" aria-hidden="true">
                {metric.icon}
              </span>
              <span className="min-w-0 flex-1 text-sm text-[#B7BDC4]">{t(METRIC_LABEL_KEY[metric.id])}</span>
              <span className="font-[family-name:var(--font-mono-technical)] text-sm text-[#58D7D4]">
                {metric.id === 'regeneration' ? t('regenerationValueGood') : metric.value}
              </span>
              <span className="text-xs text-[#58D7D4]" aria-label={t('trendUpAriaLabel')}>
                ↗
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
