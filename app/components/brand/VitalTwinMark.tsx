'use client';

type VitalTwinMarkProps = {
  /** horizontal: lines + heart + wordmark side by side. vertical: stacked. icon: mark only, no wordmark. */
  variant?: 'horizontal' | 'vertical' | 'icon';
  /** Single-color rendering (uses currentColor) for contexts that need one flat color. */
  monochrome?: boolean;
  /** Plays the "Im Takt" intro animation: pulse lines draw in, meet, form a heart, heart beats once. */
  animated?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  title?: string;
};

const HEART_PATH =
  'M50 66 C50 66 24 48 24 30 C24 20 32 12 42 12 C46 12 50 15 50 15 C50 15 54 12 58 12 C68 12 76 20 76 30 C76 48 50 66 50 66 Z';

/**
 * The VitalTwin brand mark: "Im Takt" — a human (gold, organic) pulse line and
 * an AI (teal, digital) pulse line that meet in the middle and form a heart.
 * See docs/BRAND_GUIDE.md for usage rules.
 */
export default function VitalTwinMark({
  variant = 'horizontal',
  monochrome = false,
  animated = false,
  theme = 'light',
  className = '',
  title = 'VitalTwin — Im Takt',
}: VitalTwinMarkProps) {
  const gold = monochrome ? 'currentColor' : 'var(--brand-gold, #C9A24B)';
  const teal = monochrome ? 'currentColor' : 'var(--brand-teal, #1F8A8C)';
  const wordmarkColor = theme === 'dark' ? '#F5EFE1' : '#171717';
  const isVertical = variant === 'vertical';
  const showWordmark = variant !== 'icon';

  const viewBox = isVertical ? '0 0 160 260' : showWordmark ? '0 0 420 100' : '0 0 320 100';

  return (
    <svg
      viewBox={viewBox}
      className={`vitaltwin-mark ${animated ? 'vitaltwin-mark--animated' : ''} ${className}`.trim()}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g transform={isVertical ? 'translate(20, 10)' : 'translate(0, 0)'}>
        {/* Human pulse line — organic, gold */}
        <path
          className="vitaltwin-mark__human"
          d={isVertical ? 'M60 0 Q20 40 60 80 T60 160' : 'M10 50 Q45 10 80 50 T150 50'}
          fill="none"
          stroke={gold}
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* AI pulse line — digital, teal */}
        <path
          className="vitaltwin-mark__ai"
          d={
            isVertical
              ? 'M60 260 L60 220 L90 220 L90 190 L30 190 L30 160 L60 160'
              : 'M310 50 L290 50 L290 25 L270 25 L270 75 L250 75 L250 50 L220 50'
          }
          fill="none"
          stroke={teal}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Heart — forms where the two lines meet */}
        <g transform={isVertical ? 'translate(10, 70) scale(0.55)' : 'translate(85, 0) scale(0.7)'}>
          <g className="vitaltwin-mark__heart">
            <path d={HEART_PATH} fill={gold} />
            {!monochrome && (
              <path d={HEART_PATH} fill="none" stroke="var(--brand-heart-glow, rgba(255,255,255,0.65))" strokeWidth={3} opacity={0.6} />
            )}
          </g>
        </g>
      </g>

      {showWordmark && (
        <text
          x={isVertical ? 80 : 195}
          y={isVertical ? 240 : 60}
          textAnchor={isVertical ? 'middle' : 'start'}
          fontFamily="var(--font-serif-display, serif)"
          fontSize={isVertical ? 22 : 32}
          fontWeight={600}
          fill={monochrome ? 'currentColor' : wordmarkColor}
        >
          VitalTwin
        </text>
      )}
    </svg>
  );
}
