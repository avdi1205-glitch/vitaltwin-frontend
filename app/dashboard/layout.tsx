'use client';

import Link from 'next/link';
import DashboardNav from '../components/dashboard-nav';
import DashboardBrandMark from '../components/brand/DashboardBrandMark';
import TwinEmptyState from '../components/brand/TwinEmptyState';
import { DashboardShellProvider, useDashboardShell } from './dashboard-shell';

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { profileError, clearProfileError, refetchProfile } = useDashboardShell();

  return (
    <div className="min-h-screen bg-[#0B1118] text-[#F5F2EA]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <DashboardNav />
        <DashboardBrandMark />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-[#B7BDC4]">
          Dieses Dashboard ist ein Wellness-Tool zur Gesundheitsorientierung und kein medizinisches Produkt. Die Ergebnisse ersetzen keine ärztliche Diagnose oder Therapie.
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
            <Link href="/preise" className="transition hover:text-[#58D7D4]">Preise</Link>
            <Link href="/impressum" className="transition hover:text-[#58D7D4]">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-[#58D7D4]">Datenschutz</Link>
            <Link href="/agb" className="transition hover:text-[#58D7D4]">AGB</Link>
            <Link href="/widerrufsrecht" className="transition hover:text-[#58D7D4]">Widerrufsrecht</Link>
            <Link href="/cookie-einstellungen" className="transition hover:text-[#58D7D4]">Cookie-Einstellungen</Link>
            <Link href="/ki-hinweise" className="transition hover:text-[#58D7D4]">KI-Hinweise</Link>
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
