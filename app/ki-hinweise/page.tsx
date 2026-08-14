import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import KiHinweiseClient from './KiHinweiseClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('kiHinweiseMetaTitle'),
    description: 'Informationen zur Funktion "Frag deinen Twin" und zum KI-Einsatz bei VitalTwin.',
    alternates: { canonical: '/ki-hinweise' },
  };
}

export default function KiHinweise() {
  return <KiHinweiseClient />;
}
