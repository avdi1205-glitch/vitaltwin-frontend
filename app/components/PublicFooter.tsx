'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('footer');
  const links = [
    { href: '/', label: t('home') },
    { href: '/ueber-uns', label: t('about') },
    { href: '/blog', label: t('blog') },
    { href: '/faq', label: t('faq') },
    { href: '/preise', label: t('pricing') },
    { href: '/impressum', label: t('legal') },
    { href: '/datenschutz', label: t('privacy') },
    { href: '/agb', label: t('terms') },
    { href: '/widerrufsrecht', label: t('withdrawal') },
    { href: '/cookie-einstellungen', label: t('cookies') },
    { href: '/ki-hinweise', label: t('ai') },
    { href: '/kontakt', label: t('contact') },
  ];

  return (
    <div
      className={`mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6 text-sm text-[#8E969F] ${
        centered ? 'justify-center' : ''
      } ${className}`}
    >
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="transition hover:text-[#58D7D4]">
          {link.label}
        </Link>
      ))}
      {children}
    </div>
  );
}
