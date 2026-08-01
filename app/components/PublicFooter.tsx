'use client';

import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Startseite' },
  { href: '/preise', label: 'Preise' },
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/widerrufsrecht', label: 'Widerrufsrecht' },
  { href: '/cookie-einstellungen', label: 'Cookie-Einstellungen' },
  { href: '/ki-hinweise', label: 'KI-Hinweise' },
  { href: '/kontakt', label: 'Kontakt' },
];

/**
 * Consistent legal/navigation footer for every public page (landing,
 * pricing, legal pages, auth pages). Always includes Impressum,
 * Datenschutz, Preise and Kontakt (§5 TMG / TTDSG requires legal pages to
 * be reachable from every page, not just some).
 *
 * `children` renders additional page-specific items (e.g. a "Stand: ..."
 * date) at the end of the same row.
 */
export default function PublicFooter({
  centered = false,
  className = '',
  children,
}: {
  centered?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6 text-sm text-[#8E969F] ${
        centered ? 'justify-center' : ''
      } ${className}`}
    >
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="transition hover:text-[#58D7D4]">
          {link.label}
        </Link>
      ))}
      {children}
    </div>
  );
}
