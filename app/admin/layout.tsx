'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { AdminContextProvider, AdminPrincipal } from './_lib/AdminContext';
import { ADMIN_THEME_TOKENS, AdminThemeMode } from './_lib/adminTheme';

const NAV_SECTIONS: { href: string; label: string; permission: string }[] = [
  { href: '/admin', label: 'Dashboard', permission: 'view_dashboard' },
  { href: '/admin/founder', label: 'Founder OS', permission: 'view_founder_os' },
  { href: '/admin/users', label: 'Nutzerverwaltung', permission: 'view_users' },
  { href: '/admin/content', label: 'Content Management', permission: 'view_content' },
  { href: '/admin/nutrition', label: 'Nutrition & CGM', permission: 'view_nutrition_admin' },
  { href: '/admin/ai', label: 'KI Control Center', permission: 'view_ai_usage' },
  { href: '/admin/business', label: 'Business Center', permission: 'view_business' },
  { href: '/admin/accounting', label: 'Buchhaltung', permission: 'view_accounting' },
  { href: '/admin/analytics', label: 'Analytics', permission: 'view_analytics' },
  { href: '/admin/security', label: 'Security Center', permission: 'view_security' },
  { href: '/admin/system', label: 'System Center', permission: 'view_system_status' },
  { href: '/admin/support', label: 'Support Center', permission: 'view_support' },
  { href: '/admin/integrations', label: 'Integrationen', permission: 'view_integrations' },
  { href: '/admin/affiliate', label: 'Affiliate Center', permission: 'view_affiliate' },
];

const THEME_STORAGE_KEY = 'admin-theme';

type LoadState = 'loading' | 'ready' | 'unauthenticated' | 'forbidden' | 'error';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<LoadState>('loading');
  const [principal, setPrincipal] = useState<AdminPrincipal | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<AdminThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: AdminThemeMode = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAdminPrincipal(token: string) {
      try {
        const response = await fetch(apiUrl('/api/admin/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.status === 401) {
          setState('unauthenticated');
          return;
        }
        if (response.status === 403) {
          setState('forbidden');
          return;
        }
        if (!response.ok) {
          setState('error');
          return;
        }
        const data = await response.json();
        setPrincipal({ email: data.email, role: data.role, permissions: data.permissions ?? [] });
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    const timer = window.setTimeout(() => {
      const token = window.localStorage.getItem('token');
      if (!token) {
        setState('unauthenticated');
        return;
      }
      void loadAdminPrincipal(token);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (state === 'unauthenticated') {
      router.push('/?auth=login');
    }
  }, [state, router]);

  const tokens = ADMIN_THEME_TOKENS[theme];

  if (state === 'loading' || state === 'unauthenticated') {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: tokens.muted, fontSize: '0.9rem' }}>Lädt…</p>
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ color: tokens.text, fontSize: '1.25rem', fontWeight: 700 }}>Kein Admin-Zugriff</h1>
          <p style={{ color: tokens.muted, marginTop: '0.75rem', fontSize: '0.9rem' }}>
            Dein Konto hat keine Admin-Rolle für das VitalTwin Control Center. Falls du glaubst, dass das ein Fehler
            ist, wende dich an einen bestehenden Admin.
          </p>
          <Link href="/dashboard" style={{ color: tokens.accent, display: 'inline-block', marginTop: '1rem', fontWeight: 600 }}>
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'error' || !principal) {
    return (
      <div style={{ minHeight: '100vh', background: tokens.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: tokens.danger, fontSize: '0.9rem' }}>
          Backend gerade nicht erreichbar. Bitte lade die Seite später erneut.
        </p>
      </div>
    );
  }

  const visibleSections = NAV_SECTIONS.filter((section) => principal.permissions.includes(section.permission));

  return (
    <AdminContextProvider principal={principal} theme={theme} toggleTheme={toggleTheme}>
      <div className="admin-shell" style={{ background: tokens.bg }}>
        <div className="admin-mobile-topbar" style={{ background: tokens.sidebarBg, borderBottom: `1px solid ${tokens.border}` }}>
          <button
            type="button"
            className="admin-hamburger"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Menü öffnen"
            style={{ color: tokens.text }}
          >
            ☰
          </button>
          <p style={{ color: tokens.text, fontWeight: 700, fontSize: '0.95rem' }}>VitalTwin Admin</p>
        </div>

        {mobileNavOpen && <div className="admin-overlay" onClick={() => setMobileNavOpen(false)} />}

        <aside
          className={`admin-sidebar${mobileNavOpen ? ' admin-sidebar-open' : ''}`}
          style={{
            background: tokens.sidebarBg,
            borderRight: `1px solid ${tokens.border}`,
          }}
        >
          <p style={{ color: tokens.text, fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
            VitalTwin Admin
          </p>
          <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1.5rem', wordBreak: 'break-word' }}>
            {principal.email} · {principal.role}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {visibleSections.map((section) => {
              const active = pathname === section.href;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    color: active ? tokens.accent : tokens.muted,
                    background: active ? tokens.cardHover : 'transparent',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggleTheme}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              color: tokens.text,
              background: 'transparent',
              border: `1px solid ${tokens.border}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 0.6rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? '☀️ Helles Design' : '🌙 Dunkles Design'}
          </button>
          <Link
            href="/dashboard"
            style={{ display: 'block', marginTop: '0.75rem', color: tokens.mutedMore, fontSize: '0.8rem' }}
          >
            ← Zurück zur App
          </Link>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
      <style jsx global>{`
        .admin-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          overflow-x: hidden;
        }
        .admin-mobile-topbar {
          display: none;
        }
        .admin-sidebar {
          width: 240px;
          flex-shrink: 0;
          padding: 1.5rem 1rem;
          overflow-y: auto;
        }
        .admin-overlay {
          display: none;
        }
        .admin-main {
          flex: 1;
          min-width: 0;
          max-width: 1200px;
          padding: 2rem;
        }

        @media (max-width: 900px) {
          .admin-shell {
            flex-direction: column;
          }
          .admin-mobile-topbar {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            position: sticky;
            top: 0;
            z-index: 20;
          }
          .admin-hamburger {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            padding: 0.25rem 0.4rem;
          }
          .admin-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 25;
          }
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 30;
            width: 260px;
            max-width: 82vw;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 8px 0 24px rgba(0, 0, 0, 0.35);
          }
          .admin-sidebar-open {
            transform: translateX(0);
          }
          .admin-main {
            width: 100%;
            max-width: 100%;
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .admin-main {
            padding: 0.75rem;
          }
        }
      `}</style>
    </AdminContextProvider>
  );
}
