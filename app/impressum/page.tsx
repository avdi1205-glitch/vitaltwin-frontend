import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ImpressumClient from './ImpressumClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('impressumMetaTitle'),
    description: 'Impressum und Anbieterkennzeichnung von VitalTwin.',
    alternates: { canonical: '/impressum' },
  };
}

export default function Impressum() {
  return <ImpressumClient />;
}

