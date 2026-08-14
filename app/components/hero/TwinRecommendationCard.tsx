'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RECOMMENDATIONS } from './heroData';

type TwinRecommendationCardProps = {
  onOpenRegister: () => void;
};

const RECOMMENDATION_KEY = {
  walk: 'recommendationWalk',
  sleepEarlier: 'recommendationSleepEarlier',
  drinkWater: 'recommendationDrinkWater',
  reduceStress: 'recommendationReduceStress',
} as const;

/**
 * "Dein Twin empfiehlt" — the wide recommendation card below the pulse scene.
 * Clearly marked as an illustrative example (see hero.dataDisclaimer); no
 * medical claims. "Plan übernehmen" opens the existing registration flow,
 * "Warum?" links to the existing /ki-hinweise explanation page.
 */
export default function TwinRecommendationCard({ onOpenRegister }: TwinRecommendationCardProps) {
  const t = useTranslations('hero');

  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA]">
            {t('recommendTitle')}
          </h3>
          <p className="mt-1 text-sm text-[#B7BDC4]">{t('recommendIntro')}</p>

          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {RECOMMENDATIONS.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5 text-sm text-[#F5F2EA]">
                <span aria-hidden="true">{item.icon}</span>
                {t(RECOMMENDATION_KEY[item.id])}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={onOpenRegister}
            className="rounded-full bg-[#E8B55D] px-6 py-3 text-sm font-semibold text-[#111318] transition hover:bg-[#F3C979]"
          >
            {t('adoptPlan')}
          </button>
          <Link
            href="/ki-hinweise"
            className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-[#F5F2EA] transition hover:border-white/40"
          >
            {t('why')}
          </Link>
        </div>
      </div>

      <p className="mt-5 border-t border-white/5 pt-4 text-xs text-[#8E969F]">{t('dataDisclaimer')}</p>
    </div>
  );
}
