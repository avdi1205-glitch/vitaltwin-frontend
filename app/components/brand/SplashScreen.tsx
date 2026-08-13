'use client';

import { useEffect, useState } from 'react';
import VitalTwinMark from './VitalTwinMark';

const SPLASH_SESSION_KEY = 'vitaltwin_splash_shown';
const SPLASH_VISIBLE_MS = 2000;
const SPLASH_FADE_MS = 300;

type SplashPhase = 'hidden' | 'showing' | 'hiding';

/**
 * Plays the VitalTwin "Im Takt" brand animation once per browser session,
 * overlaid on top of the app. Shown by default — including in the
 * server-rendered HTML — so there is no gap where the real page flashes
 * before the splash mounts; the effect below hides it immediately once it
 * knows this session already saw it. See docs/BRAND_GUIDE.md.
 */
export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>('showing');

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
    } catch {
      // Storage unavailable (e.g. privacy mode) — just skip the splash.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('hidden');
      return;
    }

    if (alreadyShown) {
      setPhase('hidden');
      return;
    }

    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // ignore
    }

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
          className={`fixed inset-0 z-[999] flex items-center justify-center bg-[#0B1118] transition-opacity duration-300 ${
            phase === 'hiding' ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-5 px-6 sm:gap-6">
            <VitalTwinMark
              variant="icon"
              theme="dark"
              className="vt-splash-icon h-20 w-auto sm:h-24 md:h-28"
            />
            <p className="vt-splash-word text-center font-[family-name:var(--font-serif-display)] text-4xl font-semibold tracking-tight text-[#F5F2EA] sm:text-5xl md:text-6xl">
              VitalTwin
            </p>
          </div>
        </div>
      )}
    </>
  );
}
