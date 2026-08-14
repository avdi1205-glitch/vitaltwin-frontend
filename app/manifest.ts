import type { MetadataRoute } from 'next';
import { getTranslations } from 'next-intl/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations('siteMeta');
  return {
    name: 'VitalTwin',
    short_name: 'VitalTwin',
    description: t('manifestDescription'),
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1118',
    theme_color: '#0B1118',
    lang: 'de',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/vitaltwin-mark.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
