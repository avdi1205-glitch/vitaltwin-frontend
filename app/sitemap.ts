import type { MetadataRoute } from 'next';
import { apiUrl } from '@/lib/api';

const BASE_URL = 'https://www.vitaltwin.de';

const PUBLIC_ROUTES = [
  '',
  '/ueber-uns',
  '/faq',
  '/blog',
  '/preise',
  '/beta-bewerbung',
  '/agb',
  '/datenschutz',
  '/impressum',
  '/widerrufsrecht',
  '/cookie-einstellungen',
  '/ki-hinweise',
  '/kontakt',
];

async function getPublishedBlogSlugs(): Promise<string[]> {
  try {
    const response = await fetch(apiUrl('/api/content/blog?page_size=50'));
    if (!response.ok) return [];
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: { slug: string }) => item.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const blogSlugs = await getPublishedBlogSlugs();
  const routes = [...PUBLIC_ROUTES, ...blogSlugs.map((slug) => `/blog/${slug}`)];
  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
  }));
}
