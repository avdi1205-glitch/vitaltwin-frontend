import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CookieEinstellungenClient from './CookieEinstellungenClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: t('cookieSettingsMetaTitle'),
    description: t('cookieSettingsMetaDescription'),
    alternates: { canonical: '/cookie-einstellungen' },
  };
}

export default function CookieEinstellungen() {
  const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return <CookieEinstellungenClient adsenseEnabled={adsenseEnabled} />;
}

