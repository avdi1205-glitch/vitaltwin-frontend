import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import UeberUnsClient from './UeberUnsClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('ueberUnsMetaTitle'),
    description: t('ueberUnsMetaDescription'),
    alternates: { canonical: '/ueber-uns' },
  };
}

export default function UeberUns() {
  return <UeberUnsClient />;
}

