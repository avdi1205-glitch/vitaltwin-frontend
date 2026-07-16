// Central plan / pricing / permission definitions for VitalTwin (Block 3).
//
// This is the single source of truth on the frontend for what each plan
// costs, what it includes, and which Stripe price env var backs it. Keep in
// sync with `backend/app/core/plans.py` (duplicated by necessity: frontend
// and backend are two separately deployed repos with no shared package).

export type PlanId = 'free' | 'premium' | 'pro' | 'family';
export type BillingInterval = 'monthly' | 'yearly';

export type PlanPermissions = {
  aiQuestionsPerDay: number | 'fair-unlimited';
  historyDays: number | 'extended' | 'unlimited';
  maxProfiles: number;
  hasAds: boolean;
  hasWeeklyReports: boolean;
  hasLifestyleSimulations: boolean;
  hasFamilyFeatures: boolean;
};

export type PlanFeature = {
  label: string;
  // Marks features described in the Release-1 product spec that are not
  // technically implemented yet. Shown with a "(bald verfügbar)" hint so a
  // currently-purchasable plan (Premium) never silently oversells.
  comingSoon?: boolean;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  ctaLabel: string;
  features: PlanFeature[];
  permissions: PlanPermissions;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    ctaLabel: 'Kostenlos starten',
    features: [
      { label: 'Grundlegendes Wellness-Profil' },
      { label: 'Basis-Dashboard' },
      { label: 'Grundlegender VitalTwin-Score' },
      { label: 'Schlaf-, Bewegungs- und Gewohnheitserfassung' },
      { label: 'Begrenzter Verlauf' },
      { label: 'Bis zu 3 KI-Fragen pro Tag', comingSoon: true },
      { label: 'Grundlegende Empfehlungen' },
    ],
    permissions: {
      aiQuestionsPerDay: 3,
      historyDays: 7,
      maxProfiles: 1,
      hasAds: true,
      hasWeeklyReports: false,
      hasLifestyleSimulations: false,
      hasFamilyFeatures: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 9.99,
    priceYearly: 99,
    badge: 'Beliebteste Wahl',
    ctaLabel: 'Premium wählen',
    features: [
      { label: 'Alles aus Free' },
      { label: 'Fair begrenzter KI-Chat', comingSoon: true },
      { label: 'Ausführlichere Wellness-Auswertungen' },
      { label: 'Schlaf-, Stress- und Erholungsübersicht' },
      { label: 'Wochenberichte', comingSoon: true },
      { label: 'Erweiterter Verlauf' },
      { label: 'Individuelle Tagesziele', comingSoon: true },
      { label: 'Keine Werbung' },
    ],
    permissions: {
      aiQuestionsPerDay: 'fair-unlimited',
      historyDays: 'extended',
      maxProfiles: 1,
      hasAds: false,
      hasWeeklyReports: true,
      hasLifestyleSimulations: false,
      hasFamilyFeatures: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 24.99,
    priceYearly: 249,
    ctaLabel: 'Pro wählen',
    features: [
      { label: 'Alles aus Premium' },
      { label: 'Vollständiger erweiterter digitaler Zwilling', comingSoon: true },
      { label: 'Mehrere persönliche Ziele', comingSoon: true },
      { label: 'Lifestyle-Simulationen (Wellness-Szenarien, keine medizinischen Vorhersagen)', comingSoon: true },
      { label: 'Langfristige Trends', comingSoon: true },
      { label: 'Erweiterte Berichte', comingSoon: true },
      { label: 'Prioritätszugang zu neuen Funktionen' },
      { label: 'Später: erweiterte Wearable-Integrationen', comingSoon: true },
    ],
    permissions: {
      aiQuestionsPerDay: 'fair-unlimited',
      historyDays: 'unlimited',
      maxProfiles: 1,
      hasAds: false,
      hasWeeklyReports: true,
      hasLifestyleSimulations: true,
      hasFamilyFeatures: false,
    },
  },
  family: {
    id: 'family',
    name: 'Family',
    priceMonthly: 39.99,
    priceYearly: 399,
    ctaLabel: 'Family wählen',
    features: [
      { label: 'Alles aus Premium' },
      { label: 'Bis zu 6 eigenständige Profile', comingSoon: true },
      { label: 'Getrennte private Nutzerdaten' },
      { label: 'Gemeinsame Wellness-Challenges', comingSoon: true },
      { label: 'Familienziele', comingSoon: true },
      { label: 'Familienübersicht nur mit klar geregelten Berechtigungen', comingSoon: true },
    ],
    permissions: {
      aiQuestionsPerDay: 'fair-unlimited',
      historyDays: 'unlimited',
      maxProfiles: 6,
      hasAds: false,
      hasWeeklyReports: true,
      hasLifestyleSimulations: true,
      hasFamilyFeatures: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'premium', 'pro', 'family'];

export function formatPrice(amount: number): string {
  if (amount === 0) return '0 €';
  return `${amount.toFixed(2).replace('.', ',').replace(/,00$/, '')} €`;
}

export function yearlySavingsPercent(plan: PlanDefinition): number | null {
  if (plan.priceMonthly === 0 || plan.priceYearly === 0) return null;
  const fullYearAtMonthlyRate = plan.priceMonthly * 12;
  const savings = 1 - plan.priceYearly / fullYearAtMonthlyRate;
  return Math.round(savings * 100);
}

// Public (non-secret) Stripe price IDs. Price IDs are not credentials — they
// only identify a price object — so it's safe to expose them via
// NEXT_PUBLIC_*, exactly like the original single-tier setup did with
// NEXT_PUBLIC_STRIPE_PRICE_ID. The backend independently re-validates the
// price_id server-side against its own env vars before creating a Stripe
// Checkout Session (see backend/app/core/plans.py) — the frontend value here
// only decides whether to show a "buy" or "coming soon" button.
//
// Note: Next.js only inlines `process.env.NEXT_PUBLIC_X` at build time when
// referenced as a static, literal member expression — NOT via a dynamically
// computed key like `process.env[someVariable]`. Each variable must therefore
// be referenced explicitly here and collected into a plain lookup object.
const PUBLIC_PRICE_IDS: Record<string, string | undefined> = {
  NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_FAMILY_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_YEARLY,
  // Legacy single-tier variable from before Block 3, still honored as the
  // premium/monthly fallback.
  NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
};

export function getPublicPriceId(plan: PlanId, interval: BillingInterval): string | null {
  const key = `NEXT_PUBLIC_STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
  const value = PUBLIC_PRICE_IDS[key]?.trim();
  if (value) return value;
  if (plan === 'premium' && interval === 'monthly') {
    return PUBLIC_PRICE_IDS.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim() || null;
  }
  return null;
}


export function isPlanPurchasable(plan: PlanId, interval: BillingInterval): boolean {
  if (plan === 'free') return true;
  return Boolean(getPublicPriceId(plan, interval));
}
