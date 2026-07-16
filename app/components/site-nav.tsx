'use client';

import Link from 'next/link';
import { useState } from 'react';

type SiteNavProps = {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
};

export default function SiteNav({ onOpenLogin, onOpenRegister }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-[#F5EFE1]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          onClick={closeMenu}
          className="font-[family-name:var(--font-serif-display)] text-xl font-semibold text-neutral-900"
        >
          VitalTwin
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-neutral-700 transition hover:text-black">
            Startseite
          </Link>
          <a href="#funktionen" className="text-sm font-medium text-neutral-700 transition hover:text-black">
            Funktionen
          </a>
          <Link href="/preise" className="text-sm font-medium text-neutral-700 transition hover:text-black">
            Preise
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={onOpenLogin}
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900"
          >
            Anmelden
          </button>
          <button
            onClick={onOpenRegister}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Kostenlos starten
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-900 md:hidden"
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
        <div className="border-t border-neutral-200 bg-[#F5EFE1] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
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
                className="rounded-full border border-neutral-300 px-5 py-3 text-center font-semibold"
              >
                Anmelden
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenRegister();
                }}
                className="rounded-full bg-black px-5 py-3 text-center font-semibold text-white"
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
