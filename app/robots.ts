import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/profil',
        '/onboarding',
        '/frag-deinen-twin',
        '/passwort-zuruecksetzen',
        '/passwort-bestaetigen',
      ],
    },
    sitemap: 'https://www.vitaltwin.de/sitemap.xml',
  };
}
