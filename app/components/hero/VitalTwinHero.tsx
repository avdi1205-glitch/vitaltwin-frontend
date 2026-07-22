'use client';

import VitalTwinMark from '../brand/VitalTwinMark';
import HumanMetricsCard from './HumanMetricsCard';
import TwinMetricsCard from './TwinMetricsCard';
import TwinPulseScene from './TwinPulseScene';
import TwinRecommendationCard from './TwinRecommendationCard';
import TwinChatBar from './TwinChatBar';

type VitalTwinHeroProps = {
  onOpenRegister: () => void;
};

/**
 * The VitalTwin "Du & dein Zwilling im Takt" hero — a dark, premium product
 * surface (not a plain text-and-buttons landing hero). Composed from small
 * typed components under components/hero/; see individual files for details.
 *
 * Layout: single-column DOM order (title → human card → pulse scene → AI
 * card → recommendation → chat) that already matches the required mobile
 * order; from `lg:` up, the three middle blocks become a 3-column grid.
 *
 * Login/register entry points already exist in the sticky SiteNav above this
 * section, so the hero itself only wires "Plan übernehmen" to registration
 * (matching the reference design, which has no separate hero CTA buttons).
 */
export default function VitalTwinHero({ onOpenRegister }: VitalTwinHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0B1118]">
      {/* Decorative background: dezent gold particle field (left) + teal data grid (right). Never affects readability. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 12% 30%, rgba(232,181,93,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 88% 70%, rgba(70,200,200,0.10), transparent 60%), linear-gradient(180deg, #081017 0%, #0B1118 45%, #111318 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 opacity-40 md:block"
        style={{
          backgroundImage:
            'radial-gradient(rgba(232,181,93,0.35) 1px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 20% 40%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 20% 40%, black, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 opacity-40 md:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(70,200,200,0.22) 1px, transparent 1.5px), linear-gradient(90deg, rgba(70,200,200,0.22) 1px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 80% 60%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 80% 60%, black, transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col items-center px-6 py-16 md:py-20 lg:min-h-[900px] lg:justify-center lg:py-24">
        {/* A. Top center: mark + wordmark + title */}
        <div className="flex flex-col items-center text-center">
          <VitalTwinMark variant="icon" theme="dark" className="h-10 w-auto md:h-12" />
          <p className="mt-3 font-[family-name:var(--font-mono-technical)] text-xs font-semibold tracking-[0.4em] text-[#B7BDC4]">
            VITALTWIN
          </p>
          <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-serif-display)] text-4xl font-semibold text-[#F5F2EA] sm:text-5xl md:text-6xl">
            Du &amp; dein KI-Zwilling
          </h1>
          <p className="mt-3 font-[family-name:var(--font-mono-technical)] text-sm font-medium uppercase tracking-[0.5em] text-[#8E969F]">
            Im Takt
          </p>
        </div>

        {/* B/C/D: human card, pulse scene, AI card — stacked on mobile, 3-col from lg */}
        <div className="mt-12 grid w-full min-w-0 gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,340px)] lg:items-center lg:gap-8">
          <HumanMetricsCard />
          <TwinPulseScene />
          <TwinMetricsCard />
        </div>

        {/* E: recommendation card */}
        <div className="mt-12 w-full lg:mt-16">
          <TwinRecommendationCard onOpenRegister={onOpenRegister} />
        </div>

        {/* F: chat bar */}
        <div className="mt-6 w-full">
          <TwinChatBar />
        </div>
      </div>
    </section>
  );
}
