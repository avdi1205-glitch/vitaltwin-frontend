'use client';

import { useEffect, useState } from 'react';

/**
 * Google AdSense consent + script loading, entirely inactive by default.
 *
 * VitalTwin's cookie/privacy pages (`/cookie-einstellungen`, `/datenschutz`)
 * currently state that NO advertising/tracking cookies are loaded and that
 * therefore no consent banner is needed (§ 25 Abs. 2 Nr. 2 TTDSG only
 * covers technically-necessary storage without consent). The moment an ad
 * network like AdSense loads, that claim becomes false and a real consent
 * banner is legally required (TTDSG/DSGVO) before the ad script may load.
 *
 * This whole file is a no-op — renders nothing, loads nothing — unless
 * `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is actually set. That keeps the current
 * "no tracking, no banner needed" legal claim accurate until AdSense is
 * genuinely enabled, at which point this banner (and the loader in
 * `AdSenseScript.tsx`) activate automatically together.
 */

const CONSENT_STORAGE_KEY = 'vt-ad-consent';
export const AD_CONSENT_GRANTED_EVENT = 'vt-ad-consent-granted';

export type AdConsentValue = 'granted' | 'denied';

export function getAdConsent(): AdConsentValue | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

function setAdConsent(value: AdConsentValue) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  if (value === 'granted') {
    window.dispatchEvent(new Event(AD_CONSENT_GRANTED_EVENT));
  }
}

export default function CookieConsentBanner() {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!adsenseClientId) return;
    const timer = window.setTimeout(() => {
      if (getAdConsent() === null) {
        setVisible(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [adsenseClientId]);

  if (!adsenseClientId || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0B1118]/97 px-6 py-5 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#B7BDC4]">
          VitalTwin nutzt Google AdSense, um im kostenlosen Tarif Werbung anzuzeigen. Dafür lädt Google
          Werbe-Cookies, sobald du zustimmst. Details in unserer{' '}
          <a href="/datenschutz" className="text-[#58D7D4] underline hover:text-[#F3C979]">
            Datenschutzerklärung
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => {
              setAdConsent('denied');
              setVisible(false);
            }}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-white/40"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => {
              setAdConsent('granted');
              setVisible(false);
            }}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-4 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
