import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VitalTwin',
    short_name: 'VitalTwin',
    description:
      'Dein digitaler Wellness-Zwilling für allgemeine Orientierung und mehr Wohlbefinden im Alltag.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5EFE1',
    theme_color: '#F5EFE1',
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
