'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';
import { apiUrl } from '@/lib/api';
import { ADMIN_THEME_TOKENS, AdminThemeMode, AdminThemeTokens } from './adminTheme';

export type AdminPrincipal = {
  email: string;
  role: string;
  permissions: string[];
};

export type AdminContextValue = {
  principal: AdminPrincipal;
  theme: AdminThemeMode;
  tokens: AdminThemeTokens;
  toggleTheme: () => void;
  hasPermission: (permission: string) => boolean;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminContextProvider({
  principal,
  theme,
  toggleTheme,
  children,
}: {
  principal: AdminPrincipal;
  theme: AdminThemeMode;
  toggleTheme: () => void;
  children: React.ReactNode;
}) {
  const hasPermission = useCallback(
    (permission: string) => principal.permissions.includes(permission),
    [principal.permissions],
  );

  const authFetch = useCallback((path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(apiUrl(path), { ...init, headers });
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      principal,
      theme,
      tokens: ADMIN_THEME_TOKENS[theme],
      toggleTheme,
      hasPermission,
      authFetch,
    }),
    [principal, theme, toggleTheme, hasPermission, authFetch],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin() must be used within AdminContextProvider (i.e. inside app/admin/*)');
  }
  return ctx;
}
