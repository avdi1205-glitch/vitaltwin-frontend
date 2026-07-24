/**
 * Admin Control Center — theme tokens.
 *
 * The main VitalTwin app is dark-theme-only by product decision. The Admin
 * Control Center is the one exception: it gets its own Light+Dark toggle,
 * scoped only to `/admin/*` (persisted under the separate `admin-theme`
 * localStorage key, never touching the rest of the app's styling).
 *
 * Colors reuse the existing VitalTwin brand tokens (see `app/globals.css`
 * `--brand-*` and the dashboard's dark palette in `dashboard-nav.tsx`) so the
 * admin surface still looks unmistakably like VitalTwin in both modes.
 */

export type AdminThemeMode = 'dark' | 'light';

export type AdminThemeTokens = {
  bg: string;
  sidebarBg: string;
  card: string;
  cardHover: string;
  border: string;
  text: string;
  muted: string;
  mutedMore: string;
  accent: string;
  accent2: string;
  danger: string;
  success: string;
};

export const ADMIN_THEME_TOKENS: Record<AdminThemeMode, AdminThemeTokens> = {
  dark: {
    bg: '#0B1118',
    sidebarBg: '#0B1118',
    card: 'rgba(255,255,255,0.03)',
    cardHover: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.1)',
    text: '#F5F2EA',
    muted: '#B7BDC4',
    mutedMore: '#8E969F',
    accent: '#58D7D4',
    accent2: '#F3C979',
    danger: '#F87171',
    success: '#4ADE80',
  },
  light: {
    bg: '#F5EFE1',
    sidebarBg: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F5EFE1',
    border: 'rgba(42,46,46,0.12)',
    text: '#2A2E2E',
    muted: '#5B6161',
    mutedMore: '#8A8F8F',
    accent: '#1F8A8C',
    accent2: '#C9A24B',
    danger: '#B3261E',
    success: '#1F8A3C',
  },
};
