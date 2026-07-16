'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DashboardNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '#uebersicht', label: 'Übersicht' },
    { href: '#mein-twin', label: 'Mein Twin' },
    { href: '#gewohnheiten', label: 'Gewohnheiten' },
    { href: '#verlauf', label: 'Verlauf' },
    { href: '/frag-deinen-twin', label: 'Frag deinen Twin' },
    { href: '/passwort-zuruecksetzen', label: 'Konto' },
    { href: '/preise', label: 'Tarif' },
  ];

  return (
    <nav className="sticky top-0 z-30 -mx-6 mb-6 border-b border-neutral-200 bg-[#F5EFE1]/95 px-6 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:bg-white">
      <div className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-serif-display)] text-sm font-semibold text-neutral-900">
          VitalTwin Cockpit
        </span>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Navigation schließen' : 'Navigation öffnen'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <div className="hidden flex-wrap items-center gap-4 text-sm font-medium text-neutral-700 md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="transition hover:text-black">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {menuOpen && (
        <div className="mt-3 flex flex-col gap-1 text-sm font-medium text-neutral-800 md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-2 py-3"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
