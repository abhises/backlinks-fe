import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Archive, parsePage } from '@/components/blog/BlogParts';
import { getBlogHome, getPosts, jsonLd } from '@/lib/blog';
import { getSiteUrl } from '@/lib/siteUrl';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getBlogHome()).categories.find(c => c.slug === slug);
  if (!cat) return {};
  const site = await getSiteUrl();
  const url = `${site}/blog/category/${cat.slug}`;
  const title = `${cat.name} articles | SERPsupport Blog`;
  return {
    title,
    description: cat.intro,
    alternates: { canonical: url },
    openGraph: { title, description: cat.intro, url, siteName: 'SERPsupport', type: 'website' },
    twitter: { card: 'summary_large_image', title, description: cat.intro },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const home = await getBlogHome();
  const cat = home.categories.find(c => c.slug === slug);
  if (!cat) notFound();
  const page = parsePage((await searchParams).page);
  const [site, posts] = await Promise.all([getSiteUrl(), getPosts({ category: cat.slug })]);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` },
      { '@type': 'ListItem', position: 3, name: cat.name, item: `${site}/blog/category/${cat.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      <Archive home={home} category={cat.slug} page={page} posts={posts} basePath={`/blog/category/${cat.slug}`} />
    </>
  );
}
