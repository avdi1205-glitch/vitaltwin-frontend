type WellnessScoreRingProps = {
  score: number;
  max?: number;
  size?: number;
  label?: string;
};

/**
 * Circular "Wellness-Score" gauge (e.g. 7.8 / 10) used in the AI metrics
 * card. The numeric score is rendered as real HTML text on top of the SVG
 * ring, not baked into the graphic, so it stays accessible and crisp.
 */
export default function WellnessScoreRing({ score, max = 10, size = 112, label = 'Wellness-Score' }: WellnessScoreRingProps) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score / max));
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${score.toFixed(1)} von ${max}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#46C8C8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-mono-technical)] text-2xl font-semibold text-[#F5F2EA]">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-[#8E969F]">/ {max}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-[#8E969F]">{label}</p>
    </div>
  );
}
