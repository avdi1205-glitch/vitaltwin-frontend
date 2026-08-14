'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import VitalTwinMark from './brand/VitalTwinMark';
import LanguageSelector from './LanguageSelector';

type SiteNavProps = {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
};

export default function SiteNav({ onOpenLogin, onOpenRegister }: SiteNavProps) {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  // Starts false (matches server render, avoids a hydration mismatch) and is
  // corrected in an effect right after mount — a real logged-in session must
  // never keep showing "Anmelden"/"Kostenlos starten" on public pages.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsAuthenticated(Boolean(localStorage.getItem('token')));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1118]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={closeMenu} className="flex items-center" aria-label={`VitalTwin ${t('home')}`}>
          <VitalTwinMark variant="icon" theme="dark" className="h-7 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            {t('home')}
          </Link>
          <a href="#funktionen" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            {t('features')}
          </a>
          <Link href="/preise" className="text-sm font-medium text-[#B7BDC4] transition hover:text-[#58D7D4]">
            {t('pricing')}
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/profil"
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
              >
                {t('account')}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('dashboard')}
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={onOpenLogin}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
              >
                {t('login')}
              </button>
              <button
                onClick={onOpenRegister}
                className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-2 text-sm font-semibold text-[#0B1118] transition hover:brightness-110"
              >
                {t('register')}
              </button>
            </>
          )}
        </div>

        <LanguageSelector />
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
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
              {t('home')}
            </Link>
            <a href="#funktionen" onClick={closeMenu} className="rounded-xl px-2 py-3">
              {t('features')}
            </a>
            <Link href="/preise" onClick={closeMenu} className="rounded-xl px-2 py-3">
              {t('pricing')}
            </Link>
            <div className="mt-3 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profil"
                    onClick={closeMenu}
                    className="rounded-full border border-white/20 px-5 py-3 text-center font-semibold text-[#F5F2EA]"
                  >
                    {t('account')}
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-3 text-center font-semibold text-[#0B1118]"
                  >
                    {t('dashboard')}
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenLogin();
                    }}
                    className="rounded-full border border-white/20 px-5 py-3 text-center font-semibold text-[#F5F2EA]"
                  >
                    {t('login')}
                  </button>
                  <button
                    onClick={() => {
                      closeMenu();
                      onOpenRegister();
                    }}
                    className="rounded-full bg-gradient-to-r from-[#F3C979] to-[#C9913D] px-5 py-3 text-center font-semibold text-[#0B1118]"
                  >
                    {t('register')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
