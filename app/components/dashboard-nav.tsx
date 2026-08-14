'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api';
import VitalTwinMark from './brand/VitalTwinMark';
import LanguageSelector from './LanguageSelector';

export default function DashboardNav() {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = window.localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/admin/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled && response.ok) setIsAdmin(true);
      } catch {
        // Backend unreachable or no admin access — link simply stays hidden.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const links = [
    { href: '/dashboard', label: t('overview') },
    { href: '/dashboard/blutzucker', label: t('nutrition'), badge: 'Premium' },
    { href: '/dashboard/gesundheitsdaten', label: t('healthData') },
    { href: '/dashboard/gewohnheiten', label: t('habits') },
    { href: '/dashboard/mein-twin', label: t('twin') },
    { href: '/dashboard/verlauf', label: t('history') },
    { href: '/frag-deinen-twin', label: t('askTwin') },
    { href: '/passwort-zuruecksetzen', label: t('account') },
    { href: '/preise', label: t('plan') },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-30 -mx-6 mb-6 border-b border-white/10 bg-[#0B1118]/95 px-6 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-[family-name:var(--font-serif-display)] text-sm font-semibold text-[#F5F2EA]">
          <VitalTwinMark variant="icon" theme="dark" className="h-5 w-auto" />
          {t('cockpit')}
        </span>
        <LanguageSelector />
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[#F5F2EA] md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <div className="hidden flex-wrap items-center gap-4 text-sm font-medium text-[#B7BDC4] md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="flex items-center gap-1.5 transition hover:text-[#58D7D4]">
              {link.label}
              {link.badge && (
                <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#8E969F]">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="mt-3 flex flex-col gap-1 text-sm font-medium text-[#F5F2EA] md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 rounded-xl px-2 py-3"
            >
              {link.label}
              {link.badge && (
                <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#8E969F]">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
