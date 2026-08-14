import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import WiderrufsrechtClient from './WiderrufsrechtClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('widerrufsrechtMetaTitle'),
    description: 'Informationen zum Widerrufsrecht bei VitalTwin.',
    alternates: { canonical: '/widerrufsrecht' },
  };
}

export default function Widerrufsrecht() {
  return <WiderrufsrechtClient />;
}
