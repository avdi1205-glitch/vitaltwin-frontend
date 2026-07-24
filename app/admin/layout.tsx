'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';
import { AdminContextProvider, AdminPrincipal } from './_lib/AdminContext';
import { ADMIN_THEME_TOKENS, AdminThemeMode } from './_lib/adminTheme';

const NAV_SECTIONS: { href: string; label: string; permission: string }[] = [
  { href: '/admin', label: 'Dashboard', permission: 'view_dashboard' },
  { href: '/admin/founder', label: 'Founder Dashboard', permission: 'view_founder_dashboard' },
  { href: '/admin/founder/daily-briefing', label: 'Daily Briefing', permission: 'view_founder_briefing' },
  { href: '/admin/founder/tasks', label: 'Task Manager', permission: 'view_founder_tasks' },
  { href: '/admin/users', label: 'Nutzerverwaltung', permission: 'view_users' },
  { href: '/admin/content', label: 'Content Management', permission: 'view_content' },
  { href: '/admin/nutrition', label: 'Nutrition & CGM', permission: 'view_nutrition_admin' },
  { href: '/admin/ai', label: 'KI Control Center', permission: 'view_ai_usage' },
  { href: '/admin/business', label: 'Business Center', permission: 'view_business' },
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
      <div style={{ minHeight: '100vh', background: tokens.bg, display: 'flex' }}>
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: tokens.sidebarBg,
            borderRight: `1px solid ${tokens.border}`,
            padding: '1.5rem 1rem',
          }}
        >
          <p style={{ color: tokens.text, fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
            VitalTwin Admin
          </p>
          <p style={{ color: tokens.mutedMore, fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            {principal.email} · {principal.role}
          </p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {visibleSections.map((section) => {
              const active = pathname === section.href;
              return (
                <Link
                  key={section.href}
                  href={section.href}
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
        <main style={{ flex: 1, padding: '2rem', maxWidth: 1200 }}>{children}</main>
      </div>
    </AdminContextProvider>
  );
}
