import type { MetadataRoute } from 'next';
import { getSiteUrl, siteUrls } from '@/lib/siteUrl';
import { getSitemapEntries } from '@/lib/blog';

const publicRoutes: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/how-it-works', priority: 0.8 },
  { path: '/discover', priority: 0.7 },
  { path: '/feedback', priority: 0.5 },
  { path: '/auth', priority: 0.5 },
  { path: '/signup', priority: 0.5 },
  { path: '/blog', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, blog] = await Promise.all([getSiteUrl(), getSitemapEntries()]);

  const routes = [
    ...publicRoutes.map(r => ({ ...r, lastModified: new Date() })),
    ...blog.categories.map(c => ({ path: `/blog/category/${c.slug}`, priority: 0.6, lastModified: new Date() })),
    ...blog.posts.map(p => ({ path: `/blog/${p.slug}`, priority: 0.7, lastModified: new Date(p.updatedAt) })),
  ];

  return routes.map(({ path, priority, lastModified }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
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
