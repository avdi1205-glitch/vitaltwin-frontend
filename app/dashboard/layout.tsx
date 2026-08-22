'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import DashboardNav from '../components/dashboard-nav';
import DashboardBrandMark from '../components/brand/DashboardBrandMark';
import TwinEmptyState from '../components/brand/TwinEmptyState';
import { DashboardShellProvider, useDashboardShell } from './dashboard-shell';

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard');
  const tFooter = useTranslations('footer');
  const { profileError, clearProfileError, refetchProfile } = useDashboardShell();

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <DashboardNav />
        <DashboardBrandMark />

        {/* Wortlaut unverändert, immer sichtbar, keine zusätzliche Interaktion
            nötig -- nur visuell zurückhaltender (kein großer Rahmen/große
            Box) statt der dominantesten Fläche der Seite. Position bleibt
            vor dem Seiteninhalt, damit die Offenlegung weiterhin ohne
            Scrollen sofort sichtbar ist. */}
        <div className="mt-4 flex items-start gap-2 text-xs text-[#8E969F]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{t('wellnessDisclaimer')}</span>
        </div>

        {profileError && (
          <div className="mt-6">
            <TwinEmptyState
              subtext={profileError}
              onRetry={() => {
                clearProfileError();
                refetchProfile();
              }}
            />
          </div>
        )}

        {children}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-[#8E969F]">
          <p>VitalTwin DE Dashboard</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/preise" className="transition hover:text-[#58D7D4]">{tFooter('pricing')}</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">{tFooter('legal')}</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">{tFooter('privacy')}</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">{tFooter('terms')}</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">{tFooter('withdrawal')}</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">{tFooter('cookies')}</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">{tFooter('ai')}</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Central shared shell for ALL /dashboard/* routes (Phase 3): navigation,
 * small header branding, large brand mark, wellness disclaimer, footer, and
 * the one-time authenticated-user/plan fetch — none of this is duplicated
 * per page anymore.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShellProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </DashboardShellProvider>
  );
}
