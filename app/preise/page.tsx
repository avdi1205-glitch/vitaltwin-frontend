import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PreiseClient from './PreiseClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('pricingMetaTitle'),
    description: t('pricingMetaDescription'),
    alternates: { canonical: '/preise' },
  };
}

export default function PreisePage() {
  return <PreiseClient />;
}
