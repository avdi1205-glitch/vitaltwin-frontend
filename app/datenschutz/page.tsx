import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import DatenschutzClient from './DatenschutzClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('datenschutzMetaTitle'),
    description: 'Datenschutzerklärung von VitalTwin gemäß DSGVO.',
    alternates: { canonical: '/datenschutz' },
  };
}

export default function Datenschutz() {
  return <DatenschutzClient />;
}