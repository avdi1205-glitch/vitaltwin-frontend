'use client';

import { useTranslations } from 'next-intl';
import { HUMAN_METRICS } from './heroData';
import MetricRow from './MetricRow';

const METRIC_LABEL_KEY = {
  mood: 'metricMood',
  energy: 'metricEnergy',
  sleep: 'metricSleep',
  mindfulness: 'metricMindfulness',
} as const;

/**
 * Left "DU" (human) column of the hero: gold-accented card with the
 * visitor's self-reported wellness metrics (demo values on the public page).
 */
export default function HumanMetricsCard() {
  const t = useTranslations('hero');

  return (
    <div className="min-w-0">
      <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">
        {t('humanTitle')}
      </h2>
      <div className="mt-2 h-px w-10 bg-[#E8B55D]" />
      <p className="mt-4 text-sm leading-relaxed text-[#B7BDC4]">
        {t('humanTagline1')}
        <br />
        {t('humanTagline2')}
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#8E969F]">{t('exampleValues')}</p>
        <div className="divide-y divide-white/5">
          {HUMAN_METRICS.map((metric) => (
            <MetricRow key={metric.id} icon={metric.icon} label={t(METRIC_LABEL_KEY[metric.id])} value={metric.value} max={metric.max} tone="gold" />
          ))}
        </div>
      </div>
    </div>
  );
}
