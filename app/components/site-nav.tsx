'use client';

import Link from 'next/link';
import { useState } from 'react';
import VitalTwinMark from './brand/VitalTwinMark';

type SiteNavProps = {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
};

export default function SiteNav({ onOpenLogin, onOpenRegister }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1118]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={closeMenu} className="flex items-center" aria-label="VitalTwin Startseite">
          <VitalTwinMark variant="icon" theme="dark" className="h-7 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            Startseite
          </Link>
          <a href="#funktionen" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            Funktionen
          </a>
          <Link href="/preise" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            Preise
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={onOpenLogin}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
          >
            Anmelden
          </button>
          <button
            onClick={onOpenRegister}
            className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
          >
            Kostenlos starten
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-[#F5F2EA] md:hidden"
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0B1118] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium text-[#F5F2EA]">
            <Link href="/" onClick={closeMenu} className="rounded-xl px-2 py-3">
              Startseite
            </Link>
            <a href="#funktionen" onClick={closeMenu} className="rounded-xl px-2 py-3">
              Funktionen
            </a>
            <Link href="/preise" onClick={closeMenu} className="rounded-xl px-2 py-3">
              Preise
            </Link>
            <div className="mt-3 flex flex-col gap-3">
              <button
                onClick={() => {
                  closeMenu();
                  onOpenLogin();
                }}
                className="rounded-full border border-white/20 px-5 py-3 text-center font-semibold text-[#F5F2EA]"
              >
                Anmelden
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenRegister();
                }}
                className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-3 text-center font-semibold text-[#0B1118]"
              >
                Kostenlos starten
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
