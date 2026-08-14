'use client';

import { useTranslations } from 'next-intl';

const HEART_PATH =
  'M450 152 C450 152 415 128 415 104 C415 91 425 81 438 81 C443 81 450 85 450 85 C450 85 457 81 462 81 C475 81 485 91 485 104 C485 128 450 152 450 152 Z';

const RING_RADII = [40, 62, 84, 106];

/**
 * The centerpiece of the "Im Takt" hero: a human (gold, organic) pulse line
 * and an AI (teal, digital/stepped) pulse line running toward each other and
 * meeting in a heart, surrounded by faint concentric sync rings.
 *
 * Rendered as a single scalable SVG (`vt-pulse-scene`) — no raster image.
 * Continuous ~7s loop via CSS (stroke-dashoffset / transform / opacity),
 * fully disabled under `prefers-reduced-motion: reduce` (see globals.css).
 */
export default function TwinPulseScene({ className = '' }: { className?: string }) {
  const t = useTranslations('hero');

  return (
    <div className={`flex min-w-0 flex-col items-center ${className}`.trim()}>
      <svg
        viewBox="0 0 900 260"
        className="vt-pulse-scene w-full max-w-2xl"
        role="img"
        aria-label={t('pulseSceneAriaLabel')}
      >
        <g className="vt-rings" aria-hidden="true">
          {RING_RADII.map((r, i) => (
            <circle
              key={r}
              cx={450}
              cy={116}
              r={r}
              fill="none"
              stroke={i % 2 === 0 ? '#E8B55D' : '#46C8C8'}
              strokeWidth={1}
              opacity={0.14}
              className="vt-ring"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </g>

        <path
          d="M0 116 C 30 76, 60 156, 90 116 C 120 82, 150 150, 180 112 C 210 88, 232 138, 262 118 C 292 102, 314 128, 340 116 L 392 116"
          fill="none"
          stroke="#E8B55D"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="vt-wave vt-wave--human"
          aria-hidden="true"
        />

        <path
          d="M508 116 L 540 116 L 540 84 L 570 84 L 570 152 L 600 152 L 600 100 L 630 100 L 630 132 L 660 132 L 660 116 L 900 116"
          fill="none"
          stroke="#46C8C8"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="vt-wave vt-wave--ai"
          aria-hidden="true"
        />

        <g className="vt-heart" aria-hidden="true">
          <circle cx={450} cy={116} r={38} fill="url(#vt-heart-glow)" className="vt-heart__glow" />
          <path d={HEART_PATH} fill="#E8B55D" />
          <path d={HEART_PATH} fill="none" stroke="#F5F2EA" strokeWidth={2} opacity={0.5} />
        </g>

        <defs>
          <radialGradient id="vt-heart-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F3C979" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F3C979" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#46C8C8]/30 bg-[#46C8C8]/10 px-4 py-1.5">
        <span className="text-[#58D7D4]" aria-hidden="true">
          ✓
        </span>
        <span className="font-[family-name:var(--font-mono-technical)] text-xs font-medium uppercase tracking-[0.25em] text-[#58D7D4]">
          {t('pulseSynced')}
        </span>
      </div>

      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-[#B7BDC4]">
        {t('pulseDataGoals')}
        <br />
        <span className="font-semibold text-[#F5F2EA]">{t('pulseUnderstands')}</span>
      </p>
    </div>
  );
}
