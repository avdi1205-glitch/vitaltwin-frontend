'use client';

import { useEffect, useState } from 'react';
import VitalTwinMark from './VitalTwinMark';

const SPLASH_SESSION_KEY = 'vitaltwin_splash_shown';
const SPLASH_VISIBLE_MS = 2000;
const SPLASH_FADE_MS = 300;

type SplashPhase = 'hidden' | 'showing' | 'hiding';

/**
 * Plays the VitalTwin "Im Takt" brand animation once per browser session,
 * overlaid on top of the app (the app itself always renders immediately —
 * no blocking, no hydration risk). See docs/BRAND_GUIDE.md.
 */
export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>('hidden');

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
    } catch {
      // Storage unavailable (e.g. privacy mode) — just skip the splash.
      return;
    }

    if (alreadyShown) {
      return;
    }

    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // ignore
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase('showing');
    const hideTimer = window.setTimeout(() => setPhase('hiding'), SPLASH_VISIBLE_MS);
    const removeTimer = window.setTimeout(() => setPhase('hidden'), SPLASH_VISIBLE_MS + SPLASH_FADE_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== 'hidden' && (
        <div
          className={`fixed inset-0 z-[999] flex items-center justify-center bg-[#F5EFE1] transition-opacity duration-300 ${
            phase === 'hiding' ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <VitalTwinMark animated variant="horizontal" className="h-16 w-auto md:h-20" />
        </div>
      )}
    </>
  );
}
