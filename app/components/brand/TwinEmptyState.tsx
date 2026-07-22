type TwinEmptyStateProps = {
  /** Short, calm headline — never alarming (no "Fehler!", no red). */
  headline?: string;
  /** The actual error/empty-state text (dynamic, comes from the failed request). */
  subtext: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * Calm, on-brand "no signal" state for connectivity/data-unavailable
 * situations — replaces plain red error banners with the VitalTwin visual
 * language (gold/teal duotone, paused pulse line) so a temporary hiccup
 * doesn't feel alarming. Renders real text (never information via color
 * alone) plus an optional retry action.
 */
export default function TwinEmptyState({
  headline = 'Kurzzeitig nicht erreichbar',
  subtext,
  onRetry,
  retryLabel = 'Erneut versuchen',
}: TwinEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0B1118] px-6 py-8 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 20% 20%, rgba(232,181,93,0.10), transparent 60%), radial-gradient(ellipse 60% 60% at 80% 80%, rgba(70,200,200,0.10), transparent 60%)',
        }}
      />
      <div className="relative">
        <svg
          width="56"
          height="44"
          viewBox="0 0 56 44"
          fill="none"
          role="img"
          aria-label="Verbindung pausiert"
          className="mx-auto"
        >
          <defs>
            <linearGradient id="twin-empty-gradient" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#E8B55D" />
              <stop offset="1" stopColor="#58D7D4" />
            </linearGradient>
          </defs>
          <path
            d="M28 38 C28 38 8 24 8 13 C8 7 13 3 19 3 C22.5 3 25.5 5 28 8.5"
            stroke="url(#twin-empty-gradient)"
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
          />
          <path
            d="M28 8.5 C30.5 5 33.5 3 37 3 C43 3 48 7 48 13 C48 24 28 38 28 38"
            stroke="url(#twin-empty-gradient)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeDasharray="4 5"
            fill="none"
            opacity={0.55}
          />
        </svg>

        <h3 className="mt-5 font-[family-name:var(--font-serif-display)] text-xl font-semibold text-[#F5F2EA]">
          {headline}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#B7BDC4]">{subtext}</p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-5 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
