import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import KontaktClient from './KontaktClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('kontaktMetaTitle'),
    description: t('kontaktMetaDescription'),
    alternates: { canonical: '/kontakt' },
  };
}

export default function KontaktPage() {
  return <KontaktClient />;
}
