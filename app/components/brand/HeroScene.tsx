'use client';

import TwinWave from './TwinWave';
import TwinRecommendation from './TwinRecommendation';

type HeroSceneProps = {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
};

const HUMAN_CARDS = [
  { emoji: '❤️', label: 'Stimmung' },
  { emoji: '⚡', label: 'Energie' },
  { emoji: '🌙', label: 'Schlaf' },
  { emoji: '🧘', label: 'Stress' },
  { emoji: '🥗', label: 'Ernährung' },
  { emoji: '🚶', label: 'Bewegung' },
];

const AI_CARDS = [
  { label: 'Wellness Score', value: 'Beispiel' },
  { label: 'HRV', value: 'Beispiel' },
  { label: 'Schlafqualität', value: 'Beispiel' },
  { label: 'Regeneration', value: 'Beispiel' },
  { label: 'Trend', value: 'Beispiel' },
  { label: 'Empfehlungen', value: 'Beispiel' },
];

/**
 * The VitalTwin "Im Takt" hero scene: DU (human, warm/gold, left) and DEIN
 * KI-ZWILLING (AI, anthracite/teal, right) meet in the middle as a heart.
 * Stacks DU → Herz → KI-Zwilling on mobile via natural grid row order.
 * See docs/BRAND_GUIDE.md.
 */
export default function HeroScene({ onOpenRegister, onOpenLogin }: HeroSceneProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid min-w-0 gap-10 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
          {/* Left: DU (human) */}
          <div className="min-w-0 rounded-3xl border border-neutral-200 bg-[#F5EFE1] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Du</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-neutral-900 md:text-3xl">
              Der Mensch
            </h2>
            <p className="mt-2 text-sm text-neutral-700">Deine freiwilligen Angaben zu deinem Alltag.</p>
            <div className="mt-6 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-2">
              {HUMAN_CARDS.map((card) => (
                <div key={card.label} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center">
                  <p className="text-xl">{card.emoji}</p>
                  <p className="mt-1 text-xs font-medium text-neutral-700">{card.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Im Takt — natural DOM order already gives Du → Herz → KI-Zwilling on mobile */}
          <TwinWave className="py-2 lg:px-4" />

          {/* Right: DEIN KI-ZWILLING */}
          <div className="min-w-0 rounded-3xl border border-neutral-800 bg-brand-anthracite p-8 text-[#F5EFE1]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-teal">Dein KI-Zwilling</p>
            <h2 className="mt-3 font-[family-name:var(--font-serif-display)] text-2xl font-semibold md:text-3xl">
              Die KI
            </h2>
            <p className="mt-2 text-sm text-neutral-300">Ordnet deine Werte ein und erkennt Muster.</p>
            <div className="mt-6 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-2">
              {AI_CARDS.map((card) => (
                <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-xs text-neutral-400">{card.label}</p>
                  <p className="mt-1 font-[family-name:var(--font-mono-technical)] text-sm text-brand-teal">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <button
            onClick={onOpenRegister}
            className="rounded-2xl bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-neutral-800"
          >
            Kostenlos starten
          </button>
          <button
            onClick={onOpenLogin}
            className="rounded-2xl border border-neutral-900 bg-white px-8 py-4 text-base font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            Anmelden
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-neutral-500">Kostenlos starten. Keine Kreditkarte erforderlich.</p>

        <div className="mx-auto mt-14 grid max-w-3xl gap-3 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">In wenigen Minuten eingerichtet</div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Persönliche Wellness-Einblicke</div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Datenschutzorientiert</div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">Keine medizinische Diagnose</div>
        </div>

        <div className="mt-16">
          <TwinRecommendation />
        </div>

        <div className="mx-auto mt-6 max-w-3xl">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-neutral-500">
            <span className="font-[family-name:var(--font-mono-technical)] text-sm">Frag deinen Twin...</span>
          </div>
        </div>
      </div>
    </section>
  );
}
