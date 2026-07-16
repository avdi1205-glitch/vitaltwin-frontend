import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.vitaltwin.de';

const PUBLIC_ROUTES = [
  '',
  '/preise',
  '/beta-bewerbung',
  '/agb',
  '/datenschutz',
  '/impressum',
  '/widerrufsrecht',
  '/cookie-einstellungen',
  '/ki-hinweise',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
  }));
}
