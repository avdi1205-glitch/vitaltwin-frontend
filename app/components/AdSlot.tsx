'use client';

import { useEffect, useRef } from 'react';
import { AD_CONSENT_GRANTED_EVENT, getAdConsent } from './CookieConsentBanner';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single Google AdSense ad unit. Renders nothing if AdSense isn't
 * configured (`NEXT_PUBLIC_ADSENSE_CLIENT_ID` unset) or consent hasn't
 * been granted yet — safe to place anywhere without side effects until
 * both conditions are met. `slot` is the AdSense ad-unit ID (created per
 * placement in the AdSense dashboard, e.g. "1234567890").
 */
export default function AdSlot({ slot, format = 'auto' }: { slot: string; format?: string }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!adsenseClientId) return;

    function pushAd() {
      if (pushedRef.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // AdSense script not loaded yet or blocked (ad blocker) — fail silently.
      }
    }

    if (getAdConsent() === 'granted') pushAd();
    window.addEventListener(AD_CONSENT_GRANTED_EVENT, pushAd);
    return () => window.removeEventListener(AD_CONSENT_GRANTED_EVENT, pushAd);
  }, [adsenseClientId]);

  if (!adsenseClientId) return null;

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={adsenseClientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
