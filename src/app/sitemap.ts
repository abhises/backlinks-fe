import type { MetadataRoute } from 'next';
import { getSiteUrl, siteUrls } from '@/lib/siteUrl';

const publicRoutes: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/how-it-works', priority: 0.8 },
  { path: '/discover', priority: 0.7 },
  { path: '/feedback', priority: 0.5 },
  { path: '/auth', priority: 0.5 },
  { path: '/signup', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();

  return publicRoutes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority,
    alternates: {
      languages: {
        en: `${siteUrls.en}${path}`,
        fi: `${siteUrls.fi}${path}`,
        nl: `${siteUrls.nl}${path}`,
      },
    },
  }));
}
