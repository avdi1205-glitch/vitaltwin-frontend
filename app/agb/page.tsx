import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AgbClient from './AgbClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('agbMetaTitle'),
    description: 'Allgemeine Geschäftsbedingungen für die Nutzung der VitalTwin-Plattform.',
    alternates: { canonical: '/agb' },
  };
}

export default function AGB() {
  return <AgbClient />;
}
