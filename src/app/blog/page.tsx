import type { Metadata } from 'next';
import { Archive, parsePage, str } from '@/components/blog/BlogParts';
import { getBlogHome, getPosts, isoDate, jsonLd } from '@/lib/blog';
import { getSiteUrl } from '@/lib/siteUrl';

type Props = { searchParams: Promise<{ [k: string]: string | string[] | undefined }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const [site, { settings }] = await Promise.all([getSiteUrl(), getBlogHome()]);
  const filtered = !!(str(sp.q) || str(sp.author) || parsePage(sp.page) > 1);
  const { seoTitle: title, seoDescription: description } = settings;
  return {
    title,
    description,
    alternates: { canonical: `${site}/blog` },
    // Search / author / paged views shouldn't compete with the main archive.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: `${site}/blog`, siteName: 'SERPsupport', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = str(sp.q);
  const page = parsePage(sp.page);
  const [site, home] = await Promise.all([getSiteUrl(), getBlogHome()]);
  const author = home.authors.some(a => a.slug === str(sp.author)) ? str(sp.author) : undefined;
  const posts = await getPosts({ q, author });

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Blog', name: 'SERPsupport Blog', description: home.settings.intro, url: `${site}/blog`,
        blogPost: posts.slice(0, 20).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${site}/blog/${p.slug}`, datePublished: isoDate(p.publishedAt) })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` },
      ] },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <Archive home={home} q={q} author={author} page={page} posts={posts} basePath="/blog" />
    </>
  );
}
