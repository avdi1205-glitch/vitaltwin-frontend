'use client';

import { AI_METRICS, WELLNESS_SCORE, WELLNESS_SCORE_MAX } from './heroData';
import WellnessScoreRing from './WellnessScoreRing';

/**
 * Right "DEIN KI-ZWILLING" (AI) column of the hero: teal-accented card with
 * the wellness-score ring and derived stats (demo values on the public page).
 */
export default function TwinMetricsCard() {
  return (
    <div className="min-w-0">
      <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">
        DEIN KI-ZWILLING
      </h2>
      <div className="mt-2 h-px w-10 bg-[#46C8C8]" />
      <p className="mt-4 text-sm leading-relaxed text-[#B7BDC4]">
        Objektiv. Analysiert.
        <br />
        Verständlich.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
        <div className="flex justify-center pb-4">
          <WellnessScoreRing score={WELLNESS_SCORE} max={WELLNESS_SCORE_MAX} />
        </div>
        <div className="divide-y divide-white/5 border-t border-white/5">
          {AI_METRICS.map((metric) => (
            <div key={metric.label} className="flex items-center gap-3 py-3">
              <span className="text-lg" aria-hidden="true">
                {metric.icon}
              </span>
              <span className="min-w-0 flex-1 text-sm text-[#B7BDC4]">{metric.label}</span>
              <span className="font-[family-name:var(--font-mono-technical)] text-sm text-[#58D7D4]">{metric.value}</span>
              <span className="text-xs text-[#58D7D4]" aria-label="steigender Trend">
                ↗
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
