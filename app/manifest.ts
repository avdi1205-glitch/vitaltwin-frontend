import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VitalTwin',
    short_name: 'VitalTwin',
    description:
      'Dein digitaler Gesundheits-Zwilling für ein längeres, besseres Leben.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5EFE1',
    theme_color: '#F5EFE1',
    lang: 'de',
    icons: [
      {
        src: '/globe.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/next.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
