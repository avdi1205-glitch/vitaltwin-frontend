'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { AD_CONSENT_GRANTED_EVENT, getAdConsent } from './CookieConsentBanner';

/**
 * Loads the Google AdSense library — but ONLY once the visitor has
 * actively consented via `CookieConsentBanner`, and ONLY if
 * `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is configured. Renders nothing and loads
 * nothing otherwise (see CookieConsentBanner.tsx for the full rationale).
 */
export default function AdSenseScript() {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!adsenseClientId) return;
    const timer = window.setTimeout(() => {
      if (getAdConsent() === 'granted') setConsented(true);
    }, 0);

    const onGranted = () => setConsented(true);
    window.addEventListener(AD_CONSENT_GRANTED_EVENT, onGranted);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(AD_CONSENT_GRANTED_EVENT, onGranted);
    };
  }, [adsenseClientId]);

  if (!adsenseClientId || !consented) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
