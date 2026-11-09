/* eslint-disable @next/next/no-img-element -- blog images are admin-uploaded URLs on the API host */
import Link from 'next/link';
import s from '@/app/blog/blog.module.css';
import { Avatar, Cover, RichText } from './BlogParts';
import { ShareButtons } from './BlogChrome';
import { type Block, type BlogSettings, type PostCard, type PostFull, formatDate, isoDate, mediaUrl, tocFor } from '@/lib/blog';

function BodyBlock({ b, linked }: { b: Block; linked: PostCard[] }) {
  switch (b.type) {
    case 'p': return <p><RichText text={b.text} /></p>;
    case 'h2': return <h2 id={b.id || undefined}>{b.text}</h2>;
    case 'h3': return <h3>{b.text}</h3>;
    case 'ul': return <ul>{b.items.map((t, j) => <li key={j}><RichText text={t} /></li>)}</ul>;
    case 'table': return (
      <div className={s.tableWrap}>
        <table>
          <thead><tr>{b.head.map((h, k) => <th key={k}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><RichText text={c} /></td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    case 'quote': return <blockquote className={s.quote}>“{b.text}”{b.cite && <footer>{b.cite}</footer>}</blockquote>;
    case 'related': {
      const rp = linked.find(p => p.slug === b.slug);
      if (!rp) return null;
      return (
        <Link href={`/blog/${rp.slug}`} className={s.relatedInline}>
          <span className={s.catLabel}>Related</span>
          <strong>{rp.title} →</strong>
        </Link>
      );
    }
    case 'steps': return (
      <ol className={s.steps}>
        {b.items.map(([t, d], j) => (
          <li key={j}>
            <span className={s.mono}>{String(j + 1).padStart(2, '0')}</span>
            <div><div className={s.stepT}>{t}</div><div className={s.stepD}><RichText text={d} /></div></div>
          </li>
        ))}
      </ol>
    );
    case 'image': return b.src ? (
      <figure className={s.figure}>
        <img src={mediaUrl(b.src)} alt={b.alt} loading="lazy" className={s.bodyImg} />
        {b.caption && <figcaption className={s.figcaption}>{b.caption}</figcaption>}
      </figure>
    ) : null;
    case 'figure': return (
      <figure className={s.figure}>
        <div className={s.cover} role="img" aria-label={b.caption}>{b.label}</div>
        <figcaption className={s.figcaption}>{b.caption}</figcaption>
      </figure>
    );
    // Trusted admin-authored HTML (embeds, custom layouts)
    case 'html': return <div className={s.rawHtml} dangerouslySetInnerHTML={{ __html: b.html }} />;
    default: return null;
  }
}

/** The article from the post design: header, cover, TOC + CTA sidebar, body, FAQ, sources, tags, bio. */
export function PostArticle({ post, linked, settings, url }: { post: PostFull; linked: PostCard[]; settings: BlogSettings; url: string }) {
  const { author, reviewer, category: cat } = post;
  const toc = tocFor(post);
  const firstName = author?.name.split(' ')[0];
  const updated = post.updatedAt && post.publishedAt && isoDate(post.updatedAt)! > isoDate(post.publishedAt)! ? post.updatedAt : null;

  return (
    <article>
      <header className={s.postHeader}>
        <div className={`${s.narrow} ${s.postHeaderInner}`}>
          <nav aria-label="Breadcrumb" className={s.crumbs}>
            <Link href="/">Home</Link><span>/</span>
            <Link href="/blog">Blog</Link><span>/</span>
            {cat && <><Link href={`/blog/category/${cat.slug}`}>{cat.name}</Link><span>/</span></>}
            <span className={s.here}>{post.title.split(':')[0]}</span>
          </nav>

          <div className={s.postMeta}>
            {cat && <Link href={`/blog/category/${cat.slug}`} className={s.pill}>{cat.name}</Link>}
            {post.readMinutes ? <span className={s.mono}>{post.readMinutes} min read</span> : null}
          </div>
          <h1 className={s.postH1}>{post.title || 'Untitled'}</h1>
          {post.description && <p className={s.dek}>{post.description}</p>}

          <div className={s.metaBar}>
            {author && (
              <div className={s.authorChip}>
                <Avatar name={author.name} url={author.avatarUrl} size={46} />
                <div className={s.metaCol}>
                  <Link href={`/blog?author=${author.slug}`} rel="author">{author.name}</Link>
                  {author.role && <span>{author.role}</span>}
                </div>
              </div>
            )}
            {reviewer && (
              <div className={s.metaCol}>
                <span>Reviewed by</span>
                <Link href={`/blog?author=${reviewer.slug}`}>{reviewer.name}{reviewer.role ? `, ${reviewer.role.split(',')[0]}` : ''}</Link>
              </div>
            )}
            {post.publishedAt && (
              <div className={s.metaCol}>
                <span>Published</span><time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
              </div>
            )}
            {updated && (
              <div className={s.metaCol}>
                <span>Last updated</span><time dateTime={isoDate(updated)}>{formatDate(updated)}</time>
              </div>
            )}
            <div className={s.spacer} />
            <ShareButtons url={url} title={post.title} />
          </div>
        </div>
      </header>

      <div className={s.narrow}>
        <figure className={s.heroFigure}>
          <Cover src={post.coverImage} alt={post.coverAlt ?? post.coverCaption ?? post.title} label={cat?.name} className={s.heroImg} />
          {post.coverCaption && <figcaption className={s.figcaption}>{post.coverCaption}</figcaption>}
        </figure>
      </div>

      <div className={`${s.wrap} ${s.postLayout}`}>
        <aside className={s.aside}>
          {toc.length > 0 && (
            <nav aria-label="Table of contents" className={s.toc}>
              <div className={s.tocTitle}>On this page</div>
              <ol>
                {toc.map((t, i) => (
                  <li key={t.href}><a href={t.href}><span className={s.mono}>{String(i + 1).padStart(2, '0')}</span>{t.label}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div className={s.ctaCard}>
            <div className={s.ctaTitle}>{settings.ctaTitle}</div>
            <p>{settings.ctaText}</p>
            <Link href="/auth?mode=register">{settings.ctaButton}</Link>
          </div>
        </aside>

        <div className={s.article}>
          {post.takeaways.length > 0 && (
            <section aria-label="Key takeaways" className={s.takeaways}>
              <div className={s.eyebrow} style={{ fontSize: 12 }}>Key takeaways</div>
              <ul>{post.takeaways.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ul>
            </section>
          )}

          {post.body.map((b, i) => <BodyBlock key={i} b={b} linked={linked} />)}

          {post.faqs.length ? (
            <>
              <h2 id="faq">Frequently asked questions</h2>
              <div className={s.faq}>
                {post.faqs.map(([q, a], i) => (
                  <details key={i} open={i === 0}>
                    <summary>{q}</summary>
                    <div className={s.answer}><RichText text={a} /></div>
                  </details>
                ))}
              </div>
            </>
          ) : null}

          {post.sources.length ? (
            <section aria-label="Sources" className={s.sources}>
              <div className={s.tocTitle}>Sources</div>
              <ol>{post.sources.map((src, i) => <li key={i}>{src.href ? <a href={src.href} rel="noopener" target="_blank">{src.label || src.href}</a> : src.label}</li>)}</ol>
            </section>
          ) : null}

          {post.tags.length ? (
            <div className={s.tags}>
              {post.tags.map(t => <Link key={t} href={`/blog?q=${encodeURIComponent(t)}`} rel="nofollow">#{t}</Link>)}
            </div>
          ) : null}

          {author && (
            <section aria-label="About the author" className={s.bio}>
              <Avatar name={author.name} url={author.avatarUrl} size={72} fontSize={22} />
              <div style={{ flex: '1 1 300px' }}>
                <div className={s.tocTitle}>Written by</div>
                <div className={s.name}>{author.name}</div>
                {author.bio && <p>{author.bio}</p>}
                <div className={s.links}>
                  <Link href={`/blog?author=${author.slug}`}>All articles by {firstName}</Link>
                  {author.linkedinUrl && <a href={author.linkedinUrl} rel="me noopener" target="_blank">LinkedIn</a>}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
