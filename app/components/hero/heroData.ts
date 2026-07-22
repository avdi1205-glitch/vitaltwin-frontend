/**
 * Central demo data for the VitalTwin "Im Takt" hero section.
 *
 * These are clearly-labelled EXAMPLE values (see `HERO_DATA_DISCLAIMER`) shown
 * on the public landing page before a visitor has an account. They are not
 * real personal measurements and must never be presented as a diagnosis —
 * VitalTwin is a wellness tool, not a medical device (see
 * .github/skills/vitaltwin-ship/SKILL.md).
 *
 * Once real per-user data is available (see app/dashboard/page.tsx and
 * lib/api.ts), the logged-in dashboard should read from that source instead —
 * this file only feeds the logged-out marketing hero.
 */

export type HumanMetric = {
  icon: string;
  label: string;
  value: number;
  max: number;
};

export const HUMAN_METRICS: HumanMetric[] = [
  { icon: '❤️', label: 'Stimmung', value: 7.2, max: 10 },
  { icon: '⚡', label: 'Energie', value: 6.8, max: 10 },
  { icon: '🌙', label: 'Schlaf', value: 6.1, max: 10 },
  { icon: '🧘', label: 'Achtsamkeit', value: 7.5, max: 10 },
];

export type AiMetric = {
  icon: string;
  label: string;
  value: string;
  trend: 'up' | 'flat';
};

export const AI_METRICS: AiMetric[] = [
  { icon: '❤️', label: 'HRV', value: '68 ms', trend: 'up' },
  { icon: '🌙', label: 'Schlafqualität', value: '78 %', trend: 'up' },
  { icon: '🔋', label: 'Regeneration', value: 'Gut', trend: 'up' },
  { icon: '📈', label: 'Trend', value: '+12 %', trend: 'up' },
];

export const WELLNESS_SCORE = 7.8;
export const WELLNESS_SCORE_MAX = 10;

export type Recommendation = {
  icon: string;
  text: string;
};

export const RECOMMENDATIONS: Recommendation[] = [
  { icon: '🚶', text: '20 Minuten spazieren gehen' },
  { icon: '🌙', text: 'Heute etwas früher schlafen' },
  { icon: '💧', text: 'Mehr Wasser trinken' },
  { icon: '🧘', text: 'Stress bewusst reduzieren' },
];

export const HERO_DATA_DISCLAIMER =
  'Beispielhafte Demo-Werte zur Veranschaulichung – keine echten Messdaten und keine medizinische Empfehlung. Nach der Anmeldung siehst du deine eigenen, freiwillig eingetragenen Werte.';
