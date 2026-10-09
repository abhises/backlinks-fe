import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/inbox',
        '/settings',
        '/billing',
        '/onboarding',
        '/reset-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
