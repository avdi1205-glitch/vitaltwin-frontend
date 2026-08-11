'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

export type DashboardProfile = {
  email: string;
  full_name?: string | null;
  premium: boolean;
  plan?: string;
  real_plan?: string;
  beta?: { plan: string; expires_at: string | null; remaining_days: number } | null;
  starter_calc_remaining?: number | null;
};

type DashboardShellState = {
  profile: DashboardProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<DashboardProfile | null>>;
  loadingProfile: boolean;
  profileError: string;
  clearProfileError: () => void;
  refetchProfile: () => void;
  logout: () => void;
};

const DashboardShellContext = createContext<DashboardShellState | null>(null);

/** Read the shared, EINMAL-geladenen Nutzer/Tarif-Status (Phase 5: "gemeinsam benötigte kleine Daten"). */
export function useDashboardShell(): DashboardShellState {
  const ctx = useContext(DashboardShellContext);
  if (!ctx) {
    throw new Error('useDashboardShell must be used within the /dashboard layout');
  }
  return ctx;
}

/**
 * Loads the authenticated user + real plan EXACTLY ONCE per /dashboard visit
 * (shared across /dashboard, /dashboard/blutzucker, /dashboard/gewohnheiten,
 * /dashboard/mein-twin, /dashboard/verlauf via this context) instead of every
 * route re-fetching `/api/users/me` independently.
 */
export function DashboardShellProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async (token: string) => {
    // Same retry/timeout behavior as the previous monolithic page: one silent
    // retry on a transient network error before showing a real error.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(apiUrl('/api/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as DashboardProfile | { detail?: string } | null;
        if (!isMountedRef.current) return;

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            setLoadingProfile(false);
            router.push('/?auth=login');
            return;
          }
          setProfileError(data && 'detail' in data ? data.detail ?? 'Profil konnte nicht geladen werden.' : 'Profil konnte nicht geladen werden.');
          setLoadingProfile(false);
          return;
        }

        setProfile(data as DashboardProfile);
        setProfileError('');
        setLoadingProfile(false);
        return;
      } catch {
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          continue;
        }
        if (!isMountedRef.current) return;
        setProfileError('Backend nicht erreichbar. Bitte versuche es in wenigen Sekunden erneut.');
        setLoadingProfile(false);
      } finally {
        window.clearTimeout(timeoutId);
      }
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?auth=login');
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchProfile(token);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchProfile, router]);

  const refetchProfile = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) void fetchProfile(token);
  }, [fetchProfile]);

  const clearProfileError = useCallback(() => setProfileError(''), []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    router.push('/');
  }, [router]);

  return (
    <DashboardShellContext.Provider
      value={{ profile, setProfile, loadingProfile, profileError, clearProfileError, refetchProfile, logout }}
    >
      {children}
    </DashboardShellContext.Provider>
  );
}
