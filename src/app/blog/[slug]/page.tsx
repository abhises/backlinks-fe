import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import s from '../blog.module.css';
import { PostCard } from '@/components/blog/BlogParts';
import { PostArticle } from '@/components/blog/PostArticle';
import { getBlogHome, getPost as fetchPost, isoDate, jsonLd, mediaUrl, parseJsonLd, styleHtml } from '@/lib/blog';
import { getSiteUrl } from '@/lib/siteUrl';

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page share one API call per request
const getPost = cache(fetchPost);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return {};
  const { post } = data;
  const site = await getSiteUrl();
  const url = `${site}/blog/${post.slug}`;
  const description = post.seoDescription || post.description || post.excerpt;
  const title = post.seoTitle || `${post.title} | SERPsupport`;
  const image = post.coverImage ? mediaUrl(post.coverImage) : undefined;
  return {
    title,
    description,
    authors: post.author ? [{ name: post.author.name, url: `${site}/blog?author=${post.author.slug}` }] : undefined,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.seoTitle || post.title, description, url, siteName: 'SERPsupport', type: 'article',
      publishedTime: post.publishedAt ?? undefined, modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : undefined, section: post.category?.name, tags: post.tags,
      ...(image && { images: [{ url: image, alt: post.coverAlt ?? post.title }] }),
    },
    twitter: { card: 'summary_large_image', title: post.seoTitle || post.title, description, ...(image && { images: [image] }) },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [data, site, home] = await Promise.all([getPost(slug), getSiteUrl(), getBlogHome()]);
  if (!data) notFound();
  const { post, linked, related } = data;
  const url = `${site}/blog/${post.slug}`;
  const cat = post.category;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.seoDescription || post.description,
        url,
        mainEntityOfPage: url,
        ...(post.coverImage && { image: mediaUrl(post.coverImage) }),
        datePublished: isoDate(post.publishedAt),
        dateModified: isoDate(post.updatedAt),
        articleSection: cat?.name,
        keywords: post.tags.join(', ') || undefined,
        ...(post.author && { author: { '@type': 'Person', name: post.author.name, jobTitle: post.author.role, url: `${site}/blog?author=${post.author.slug}` } }),
        ...(post.reviewer && { reviewedBy: { '@type': 'Person', name: post.reviewer.name } }),
        publisher: { '@type': 'Organization', name: 'SERPsupport', url: site, logo: { '@type': 'ImageObject', url: `${site}/icon.svg` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog` },
          ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat.name, item: `${site}/blog/category/${cat.slug}` }] : []),
          { '@type': 'ListItem', position: cat ? 4 : 3, name: post.title, item: url },
        ],
      },
      ...(post.faqs.length ? [{
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }] : []),
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />
      {parseJsonLd(post.jsonLd).map((extra, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(extra)} />)}
      {post.customCss && <style dangerouslySetInnerHTML={styleHtml(post.customCss)} />}
      <PostArticle post={post} linked={linked} settings={home.settings} url={url} />

      {related.length > 0 && (
        <section className={`${s.wrap} ${s.relatedSec}`}>
          <div className={s.gridHead}>
            <h2>Keep reading</h2>
            {cat && <Link href={`/blog/category/${cat.slug}`}>More in {cat.name} →</Link>}
          </div>
          <div className={s.grid}>{related.map(p => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
    </main>
  );
}
