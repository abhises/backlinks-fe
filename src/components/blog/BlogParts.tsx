/* eslint-disable @next/next/no-img-element -- blog images are admin-uploaded URLs on the API host */
import Link from 'next/link';
import s from '@/app/blog/blog.module.css';
import { type BlogHome, type PostCard as Card, formatDate, initials, isoDate, mediaUrl } from '@/lib/blog';

/** Renders text with [anchor](/href) inline links. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    parts.push(href.startsWith('/')
      ? <Link key={m.index} href={href}>{label}</Link>
      : <a key={m.index} href={href} rel="noopener" target="_blank">{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Cover image, or the striped placeholder from the design when none is set. */
export function Cover({ src, alt, label, className }: { src?: string | null; alt?: string | null; label?: string; className?: string }) {
  if (src) return <img src={mediaUrl(src)} alt={alt ?? ''} loading="lazy" className={`${s.coverImg} ${className ?? ''}`} />;
  return <div className={`${s.cover} ${className ?? ''}`} aria-hidden="true">{label}</div>;
}

export function Avatar({ name, url, size, fontSize }: { name?: string; url?: string | null; size: number; fontSize?: number }) {
  if (url) return <img src={mediaUrl(url)} alt="" className={s.avatar} style={{ width: size, height: size, objectFit: 'cover' }} />;
  return <span className={s.avatar} style={{ width: size, height: size, fontSize }}>{initials(name)}</span>;
}

export function PostCard({ post }: { post: Card }) {
  return (
    <Link href={`/blog/${post.slug}`} className={s.card}>
      <Cover src={post.coverImage} alt={post.coverAlt} label={post.category?.name} className={s.cardCover} />
      <div className={s.cardBody}>
        {post.category && <span className={s.catLabel}>{post.category.name}</span>}
        <h3 className={s.cardTitle}>{post.title}</h3>
        <p className={s.cardExcerpt}>{post.excerpt}</p>
        <div className={s.cardMeta}>
          {post.author && <><strong>{post.author.name}</strong><span>·</span></>}
          <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
          {post.readMinutes ? <span className={s.mono}>{post.readMinutes} min read</span> : null}
        </div>
      </div>
    </Link>
  );
}

export const PAGE_SIZE = 9;

type ArchiveProps = {
  home: BlogHome;
  category?: string; // category slug, undefined = all
  q?: string;
  author?: string;
  page: number;
  posts: Card[]; // already filtered, newest first
  basePath: string;
};

/** Shared overview / category archive page. */
export function Archive({ home, category, q, author, page, posts, basePath }: ArchiveProps) {
  const { settings, categories, authors, total } = home;
  const cat = category ? categories.find(c => c.slug === category) : undefined;
  const filtering = !!(q || author);
  const showFeatured = !cat && !filtering && page === 1;
  const featured = showFeatured ? (posts.find(p => p.featured) ?? posts[0]) : undefined;
  const list = featured ? posts.filter(p => p !== featured) : posts;
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const authorName = author ? authors.find(a => a.slug === author)?.name : undefined;

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (author) params.set('author', author);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const gridTitle = q ? `Results for “${q}”`
    : authorName ? `Articles by ${authorName}`
    : cat ? `Articles in ${cat.name}` : 'Latest articles';

  return (
    <main>
      <section className={s.hero}>
        <div className={`${s.wrap} ${s.heroInner}`}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link><span>/</span>
            {cat ? <><Link href="/blog">Blog</Link><span>/</span><span className={s.here}>{cat.name}</span></>
              : <span className={s.here}>Blog</span>}
          </nav>
          <div className={s.heroRow}>
            <div className={s.heroText}>
              <div className={s.eyebrow}>{cat ? 'Category' : settings.eyebrow}</div>
              <h1 className={s.h1}>{cat ? cat.h1 || cat.name : settings.h1}</h1>
              <p className={s.lead}>{cat ? cat.intro : settings.intro}</p>
            </div>
            <form action="/blog" method="get" role="search" className={s.search}>
              <button type="submit" aria-label="Search" className={s.mono}>⌕</button>
              <input type="search" name="q" defaultValue={q} placeholder="Search articles" aria-label="Search articles" />
            </form>
          </div>
          <div className={s.tabs} aria-label="Categories">
            <Link href="/blog" className={`${s.tab} ${!cat && !filtering ? s.tabActive : ''}`}>
              All articles<span className={s.count}>{total}</span>
            </Link>
            {categories.filter(c => c.count > 0 || c.slug === cat?.slug).map(c => (
              <Link key={c.slug} href={`/blog/category/${c.slug}`} className={`${s.tab} ${cat?.slug === c.slug ? s.tabActive : ''}`}>
                {c.name}<span className={s.count}>{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured && (
        <section className={`${s.wrap} ${s.featuredSec}`}>
          <Link href={`/blog/${featured.slug}`} className={s.featured}>
            <Cover src={featured.coverImage} alt={featured.coverAlt} label={featured.category?.name} className={s.featuredCover} />
            <div className={s.featuredBody}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={s.pill}>Featured</span>
                {featured.category && <span className={s.catLabel} style={{ color: '#6B7385' }}>{featured.category.name}</span>}
              </div>
              <h2 className={s.featuredTitle}>{featured.title}</h2>
              <p className={s.featuredExcerpt}>{featured.excerpt}</p>
              <div className={s.byline}>
                {featured.author && <>
                  <Avatar name={featured.author.name} url={featured.author.avatarUrl} size={36} fontSize={13} />
                  <strong>{featured.author.name}</strong><span>·</span>
                </>}
                <time dateTime={isoDate(featured.publishedAt)}>{formatDate(featured.publishedAt)}</time>
                {featured.readMinutes ? <><span>·</span><span>{featured.readMinutes} min read</span></> : null}
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className={`${s.wrap} ${s.gridSec}`}>
        <div className={s.gridHead}>
          <h2>{gridTitle}</h2>
          <span className={s.mono}>{list.length} {list.length === 1 ? 'article' : 'articles'}</span>
        </div>
        {shown.length ? (
          <div className={s.grid}>{shown.map(p => <PostCard key={p.id} post={p} />)}</div>
        ) : (
          <div className={s.empty}>
            {filtering ? <>No articles match that search. <Link href="/blog">See all articles</Link></> : 'No articles here yet.'}
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pagination" className={s.pager}>
            {page > 1 ? <Link href={pageHref(page - 1)}>← Prev</Link> : <span className={s.disabled}>← Prev</span>}
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => n === page
              ? <span key={n} className={s.current} aria-current="page">{n}</span>
              : <Link key={n} href={pageHref(n)}>{n}</Link>)}
            {page < pages ? <Link href={pageHref(page + 1)}>Next →</Link> : <span className={s.disabled}>Next →</span>}
          </nav>
        )}
      </section>

      {settings.pillars.length > 0 && (
        <section className={`${s.wrap} ${s.pillarSec}`}>
          <div className={s.pillarBox}>
            <div style={{ flex: '1 1 300px' }}>
              <div className={s.eyebrow}>Start here</div>
              <h2>{settings.pillarsTitle}</h2>
              <p>{settings.pillarsText}</p>
            </div>
            <ol className={s.pillarList}>
              {settings.pillars.map((pl, i) => (
                <li key={i}><Link href={pl.href}><span className={s.mono}>{String(i + 1).padStart(2, '0')}</span>{pl.title}</Link></li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}

export function parsePage(v: string | string[] | undefined) {
  const n = parseInt(Array.isArray(v) ? v[0] : v ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function str(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) || undefined;
}
