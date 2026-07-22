'use client';

import TwinPulse from './TwinPulse';
import TwinHeart from './TwinHeart';

type TwinWaveProps = {
  className?: string;
  animated?: boolean;
};

/**
 * The center of the "Im Takt" hero scene: the human (gold) pulse line and the
 * AI (teal) pulse line run toward each other and meet in a heart, with the
 * "Im Takt" label and tagline beneath. See docs/BRAND_GUIDE.md.
 */
export default function TwinWave({ className = '', animated = true }: TwinWaveProps) {
  return (
    <div className={`flex min-w-0 flex-col items-center ${className}`.trim()}>
      <div className="flex w-full max-w-xl items-center gap-3 sm:gap-4">
        <TwinPulse variant="human" animated={animated} className="h-10 min-w-0 flex-1 sm:h-12" />
        <TwinHeart animated={animated} className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14" />
        <TwinPulse variant="ai" animated={animated} className="h-10 min-w-0 flex-1 sm:h-12" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Im Takt</p>
      <p className="mt-3 max-w-md text-center text-neutral-700">
        Deine Daten. Deine Ziele.<br />Dein Twin versteht dich.
      </p>
    </div>
  );
}
