'use client';

type TwinPulseProps = {
  /** "human" renders an organic, smooth wave (gold). "ai" renders a stepped, digital wave (teal). */
  variant: 'human' | 'ai';
  className?: string;
  /** Plays a slow, continuous flowing-pulse animation along the line. */
  animated?: boolean;
};

const HUMAN_PATH = 'M0 40 C 40 10, 80 70, 120 40 C 160 10, 200 70, 240 40 C 280 10, 320 70, 360 40 L 400 40';
const AI_PATH =
  'M400 40 L 360 40 L 360 15 L 330 15 L 330 65 L 300 65 L 300 40 L 260 40 L 260 20 L 230 20 L 230 60 L 200 60 L 200 40 L 0 40';

/**
 * A single VitalTwin pulse line — the "human" (organic, gold) or "ai" (digital,
 * teal) half of the "Im Takt" brand mark, scaled up for hero-sized use. See
 * docs/BRAND_GUIDE.md.
 */
export default function TwinPulse({ variant, className = '', animated = false }: TwinPulseProps) {
  const isHuman = variant === 'human';
  const color = isHuman ? 'var(--brand-gold, #C9A24B)' : 'var(--brand-teal, #1F8A8C)';

  return (
    <svg
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      className={`twin-pulse ${animated ? 'twin-pulse--animated' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <path
        d={isHuman ? HUMAN_PATH : AI_PATH}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </svg>
  );
}
