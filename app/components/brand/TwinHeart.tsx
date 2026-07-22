'use client';

type TwinHeartProps = {
  className?: string;
  /** Plays a slow, continuous heartbeat pulse + glow. */
  animated?: boolean;
};

const HEART_PATH =
  'M50 66 C50 66 24 48 24 30 C24 20 32 12 42 12 C46 12 50 15 50 15 C50 15 54 12 58 12 C68 12 76 20 76 30 C76 48 50 66 50 66 Z';

/**
 * The heart that forms where the human (gold) and AI (teal) pulse lines meet
 * — the centerpiece of the "Im Takt" brand mark. See docs/BRAND_GUIDE.md.
 */
export default function TwinHeart({ className = '', animated = false }: TwinHeartProps) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={`twin-heart ${animated ? 'twin-heart--animated' : ''} ${className}`.trim()}
      aria-hidden="true"
    >
      <circle cx="50" cy="35" r="34" fill="var(--brand-gold, #C9A24B)" opacity="0.12" className="twin-heart__glow" />
      <path d={HEART_PATH} fill="var(--brand-gold, #C9A24B)" />
      <path
        d={HEART_PATH}
        fill="none"
        stroke="var(--brand-heart-glow, rgba(255,255,255,0.65))"
        strokeWidth={3}
        opacity={0.6}
      />
    </svg>
  );
}
