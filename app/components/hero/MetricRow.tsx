type MetricRowProps = {
  icon: string;
  label: string;
  value: number;
  max?: number;
  /** Tailwind color token for the fill bar and value text, e.g. "gold" or "teal". */
  tone?: 'gold' | 'teal';
};

const TONE_CLASSES: Record<'gold' | 'teal', { fill: string; text: string }> = {
  gold: { fill: 'bg-[#E8B55D]', text: 'text-[#F3C979]' },
  teal: { fill: 'bg-[#46C8C8]', text: 'text-[#58D7D4]' },
};

/**
 * One measurement row inside a hero metrics card: icon, label, progress bar
 * and numeric value. Value is always rendered as visible text too, so the
 * information is never conveyed by color/bar length alone.
 */
export default function MetricRow({ icon, label, value, max = 10, tone = 'gold' }: MetricRowProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const tones = TONE_CLASSES[tone];

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-[#B7BDC4]">{label}</span>
          <span className={`font-[family-name:var(--font-mono-technical)] text-sm ${tones.text}`}>
            {value.toFixed(1)} / {max}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${tones.fill}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
