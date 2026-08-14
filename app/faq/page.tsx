import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FaqClient from './FaqClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('faqMetaTitle'),
    description: t('faqMetaDescription'),
    alternates: { canonical: '/faq' },
  };
}

export default function Faq() {
  return <FaqClient />;
}

