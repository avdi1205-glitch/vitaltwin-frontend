import type { Metadata } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import DashboardCheckin from '../../components/dashboard-checkin';
import DashboardGoals from '../../components/dashboard-goals';
import DashboardHabits from '../../components/dashboard-habits';
import DashboardRecommendations from '../../components/dashboard-recommendations';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('gewohnheitenPage');
  return { title: t('title') };
}

/**
 * Gewohnheiten: Check-in, Ziele, Gewohnheiten sowie die laufende
 * verhaltensbasierte Empfehlungs-Engine ("Dein Twin empfiehlt") — bewusst
 * NICHT die marker-/berechnungsgebundenen Empfehlungen der Twin-Auswertung
 * (die bleiben exklusiv auf /dashboard/mein-twin, siehe Zuordnungstabelle).
 */
export default function GewohnheitenPage() {
  const t = useTranslations('gewohnheitenPage');
  return (
    <section className="mt-8 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif-display)] text-2xl font-semibold text-[#F5F2EA] md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#B7BDC4]">
            {t('description')}
          </p>
        </div>
        <Link
          href="/profil#datenschutz"
          className="inline-block shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#B7BDC4] transition hover:border-[#58D7D4]/60 hover:text-[#58D7D4]"
        >
          {t('privacyLink')}
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
            {t('youColumn')}
          </p>
          <DashboardCheckin />
          <DashboardGoals />
          <DashboardHabits />
        </div>

        <div className="min-w-0 space-y-6">
          <p className="font-[family-name:var(--font-mono-technical)] text-xs uppercase tracking-[0.22em] text-[#8E969F]">
            {t('yourTwinColumn')}
          </p>
          <DashboardRecommendations />
        </div>
      </div>
    </section>
  );
}
