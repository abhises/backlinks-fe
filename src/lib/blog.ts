import { cache } from 'react';

// Blog data comes from the backend (/api/blog/*) and is edited in /admin/blog.
// Inline links inside body text use markdown-style syntax: [anchor text](/href)

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string; toc?: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'quote'; text: string; cite: string }
  | { type: 'related'; slug: string }
  | { type: 'steps'; items: [string, string][] }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'figure'; label: string; caption: string }
  | { type: 'html'; html: string };

export type BlockType = Block['type'];

export type AuthorRef = { slug: string; name: string; role: string; bio: string; avatarUrl: string | null; linkedinUrl: string | null };
export type CategoryRef = { slug: string; name: string };

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  coverAlt: string | null;
  readMinutes: number | null;
  featured: boolean;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string;
  category: CategoryRef | null;
  author: AuthorRef | null;
};

export type PostFull = PostCard & {
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  coverCaption: string | null;
  customCss: string | null;
  jsonLd: string | null;
  takeaways: string[];
  body: Block[];
  faqs: [string, string][];
  sources: { label: string; href: string }[];
  reviewer: AuthorRef | null;
};

export type BlogSettings = {
  eyebrow: string;
  h1: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  pillarsTitle: string;
  pillarsText: string;
  pillars: { title: string; href: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  newsletterTitle: string;
  newsletterText: string;
  customCss?: string | null;
};

export type CategoryInfo = { slug: string; name: string; h1: string; intro: string; sortOrder: number; count: number };
export type BlogHome = { settings: BlogSettings; total: number; categories: CategoryInfo[]; authors: AuthorRef[] };

export const DEFAULT_SETTINGS: BlogSettings = {
  eyebrow: 'SERPsupport blog',
  h1: 'Link building, explained by people who do it daily.',
  intro: 'Guides, data and playbooks on earning backlinks, guest posting, niche edits and keeping your link profile clean.',
  seoTitle: 'SERPsupport Blog — Link building guides, guest posting & SEO',
  seoDescription: 'Practical guides on link building, guest posts, niche edits and backlink monitoring from the SERPsupport team.',
  pillarsTitle: 'Pillar guides',
  pillarsText: 'Long-form guides that every article in the category links back to.',
  pillars: [],
  ctaTitle: 'Build links without the swap trail.',
  ctaText: 'Chat with site owners and approve every placement. 7-day free trial.',
  ctaButton: 'Create account →',
  newsletterTitle: 'One link building idea, every other Tuesday.',
  newsletterText: 'New guides and placement data from the SERPsupport network. No spam, unsubscribe anytime.',
};

// ─── API ────────────────────────────────────────────────────────────────────

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
// Server-side calls can use an internal address (e.g. http://127.0.0.1:4000) to skip the public hop.
const SERVER_API = process.env.API_URL_INTERNAL || PUBLIC_API;

async function blogFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SERVER_API}/api/blog${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Cached per request: the layout, metadata and page all read it. */
export const getBlogHome = cache(async (): Promise<BlogHome> => {
  try {
    return (await blogFetch<BlogHome>('/home'))!;
  } catch (e) {
    console.error(e);
    return { settings: DEFAULT_SETTINGS, total: 0, categories: [], authors: [] };
  }
});

export async function getPosts(params: { q?: string; category?: string; author?: string } = {}): Promise<PostCard[]> {
  const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const d = await blogFetch<{ posts: PostCard[] }>(`/posts${sp.size ? `?${sp}` : ''}`);
  return d?.posts ?? [];
}

export async function getPost(slug: string) {
  return blogFetch<{ post: PostFull; linked: PostCard[]; related: PostCard[] }>(`/posts/${encodeURIComponent(slug)}`);
}

export async function getSitemapEntries() {
  try {
    return (await blogFetch<{ posts: { slug: string; updatedAt: string }[]; categories: { slug: string }[] }>('/sitemap'))
      ?? { posts: [], categories: [] };
  } catch {
    return { posts: [], categories: [] };
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Uploaded images are stored as /uploads/... on the API host. */
export const mediaUrl = (u?: string | null) => (u && u.startsWith('/uploads/') ? `${PUBLIC_API}${u}` : u || '');

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

export const isoDate = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : undefined);

export const initials = (name?: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('');

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

export function tocFor(post: Pick<PostFull, 'body' | 'faqs'>) {
  const items: { href: string; label: string }[] = [];
  for (const b of post.body) {
    if (b.type === 'h2' && b.id) items.push({ href: `#${b.id}`, label: b.toc || b.text });
    // Hand-written HTML: <h2 id="…"> headings also go in "On this page"
    if (b.type === 'html') {
      for (const m of b.html.matchAll(/<h2\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/h2>/gi)) {
        const label = m[0].match(/data-toc=["']([^"']+)["']/i)?.[1] ?? stripTags(m[2]);
        items.push({ href: `#${m[1]}`, label });
      }
    }
  }
  if (post.faqs?.length) items.push({ href: '#faq', label: 'FAQ' });
  return items;
}

/** Admin-written CSS for a <style> tag; a closing </style> inside it can't break out. */
export const styleHtml = (css?: string | null) => ({ __html: (css ?? '').replace(/<\/style/gi, '<\\/style') });

/** Parses admin-written JSON-LD; invalid JSON is ignored. */
export function parseJsonLd(s?: string | null): unknown[] {
  if (!s?.trim()) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [v]; } catch { return []; }
}

export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
