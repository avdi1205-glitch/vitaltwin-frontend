'use client';

import { HUMAN_METRICS } from './heroData';
import MetricRow from './MetricRow';

/**
 * Left "DU" (human) column of the hero: gold-accented card with the
 * visitor's self-reported wellness metrics (demo values on the public page).
 */
export default function HumanMetricsCard() {
  return (
    <div className="min-w-0">
      <h2 className="font-[family-name:var(--font-serif-display)] text-3xl font-semibold text-[#F5F2EA] md:text-4xl">
        DU
      </h2>
      <div className="mt-2 h-px w-10 bg-[#E8B55D]" />
      <p className="mt-4 text-sm leading-relaxed text-[#B7BDC4]">
        Dein Gefühl.
        <br />
        Deine Wahrnehmung.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
        <div className="divide-y divide-white/5">
          {HUMAN_METRICS.map((metric) => (
            <MetricRow key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} max={metric.max} tone="gold" />
          ))}
        </div>
      </div>
    </div>
  );
}
