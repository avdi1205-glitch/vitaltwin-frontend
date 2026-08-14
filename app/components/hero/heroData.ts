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
  id: 'mood' | 'energy' | 'sleep' | 'mindfulness';
  icon: string;
  value: number;
  max: number;
};

export const HUMAN_METRICS: HumanMetric[] = [
  { id: 'mood', icon: '❤️', value: 7.2, max: 10 },
  { id: 'energy', icon: '⚡', value: 6.8, max: 10 },
  { id: 'sleep', icon: '🌙', value: 6.1, max: 10 },
  { id: 'mindfulness', icon: '🧘', value: 7.5, max: 10 },
];

export type AiMetric = {
  id: 'hrv' | 'sleepQuality' | 'regeneration' | 'trend';
  icon: string;
  value: string;
  trend: 'up' | 'flat';
};

export const AI_METRICS: AiMetric[] = [
  { id: 'hrv', icon: '❤️', value: '68 ms', trend: 'up' },
  { id: 'sleepQuality', icon: '🌙', value: '78 %', trend: 'up' },
  { id: 'regeneration', icon: '🔋', value: '', trend: 'up' },
  { id: 'trend', icon: '📈', value: '+12 %', trend: 'up' },
];

export const WELLNESS_SCORE = 7.8;
export const WELLNESS_SCORE_MAX = 10;

export type Recommendation = {
  icon: string;
  id: 'walk' | 'sleepEarlier' | 'drinkWater' | 'reduceStress';
};

export const RECOMMENDATIONS: Recommendation[] = [
  { icon: '🚶', id: 'walk' },
  { icon: '🌙', id: 'sleepEarlier' },
  { icon: '💧', id: 'drinkWater' },
  { icon: '🧘', id: 'reduceStress' },
];
