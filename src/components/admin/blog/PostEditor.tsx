'use client';
import type { EditorView } from '@codemirror/view';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { blogFontVars } from '@/app/blog/fonts';
import blogStyles from '@/app/blog/blog.module.css';
import { PostArticle } from '@/components/blog/PostArticle';
import { type Block, type BlogSettings, DEFAULT_SETTINGS, type PostCard, type PostFull, mediaUrl, parseJsonLd, styleHtml } from '@/lib/blog';
import { BlockEditor, cleanBlocks } from './BlockEditor';
import { CodeField } from './CodeField';
import { blocksToHtml } from './htmlExport';
import { type AdminAuthor, type AdminCategory, ImageField, type Media, MediaPicker, blogApi, slugify } from './shared';
import { STARTER_LABEL, type StarterType, starter } from './starters';
import a from './adminBlog.module.css';

type Status = 'DRAFT' | 'PUBLISHED';

type Form = {
  status: Status; featured: boolean; slug: string; title: string; excerpt: string; description: string;
  seoTitle: string; seoDescription: string; coverImage: string; coverAlt: string; coverCaption: string;
  readMinutes: string; publishedAt: string; categoryId: string; authorId: string; reviewerId: string;
  takeaways: string; tags: string; sources: string; customCss: string; jsonLd: string;
  faqs: [string, string][]; body: Block[];
};

type ApiPost = {
  id: string; status: Status; featured: boolean; slug: string; title: string; excerpt: string; description: string;
  seoTitle: string | null; seoDescription: string | null; coverImage: string | null; coverAlt: string | null; coverCaption: string | null;
  customCss: string | null; jsonLd: string | null;
  readMinutes: number | null; publishedAt: string | null; updatedAt: string; categoryId: string | null; authorId: string | null; reviewerId: string | null;
  takeaways: string[]; tags: string[]; sources: { label: string; href: string }[]; faqs: [string, string][]; body: Block[];
};

const blank = (type: StarterType): Form => ({
  status: 'DRAFT', featured: false, slug: '', title: '', excerpt: '', description: '', seoTitle: '', seoDescription: '',
  coverImage: '', coverAlt: '', coverCaption: '', readMinutes: '', publishedAt: '', categoryId: '', authorId: '', reviewerId: '',
  tags: '', sources: '', customCss: '', jsonLd: '',
  ...starter(type),
});

/** ISO → value for <input type="datetime-local"> in local time */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const lines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean);

const toForm = (p: ApiPost): Form => ({
  status: p.status, featured: p.featured, slug: p.slug, title: p.title, excerpt: p.excerpt, description: p.description,
  seoTitle: p.seoTitle ?? '', seoDescription: p.seoDescription ?? '', coverImage: p.coverImage ?? '', coverAlt: p.coverAlt ?? '',
  coverCaption: p.coverCaption ?? '', readMinutes: p.readMinutes?.toString() ?? '', publishedAt: toLocalInput(p.publishedAt),
  categoryId: p.categoryId ?? '', authorId: p.authorId ?? '', reviewerId: p.reviewerId ?? '',
  takeaways: p.takeaways.join('\n'), tags: p.tags.join(', '),
  sources: p.sources.map(s => (s.label && s.label !== s.href ? `${s.label} | ${s.href}` : s.href)).join('\n'),
  customCss: p.customCss ?? '', jsonLd: p.jsonLd ?? '',
  faqs: p.faqs, body: p.body.length ? p.body : [{ type: 'p', text: '' }],
});

const toPayload = (f: Form) => ({
  status: f.status, featured: f.featured, slug: f.slug || f.title, title: f.title, excerpt: f.excerpt, description: f.description,
  seoTitle: f.seoTitle, seoDescription: f.seoDescription, coverImage: f.coverImage, coverAlt: f.coverAlt, coverCaption: f.coverCaption,
  customCss: f.customCss, jsonLd: f.jsonLd,
  readMinutes: f.readMinutes ? Number(f.readMinutes) : null,
  publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
  categoryId: f.categoryId, authorId: f.authorId, reviewerId: f.reviewerId,
  takeaways: lines(f.takeaways),
  tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
  sources: lines(f.sources).map(l => { const i = l.lastIndexOf('|'); return i < 0 ? { label: l, href: l } : { label: l.slice(0, i).trim(), href: l.slice(i + 1).trim() }; }),
  faqs: f.faqs.map(([q, ans]) => [q.trim(), ans.trim()]).filter(([q, ans]) => q || ans),
  body: cleanBlocks(f.body),
});

/** The post is edited as hand-written HTML when its body is a single Custom HTML block. */
const htmlOnly = (body: Block[]) => body.length === 1 && body[0].type === 'html';

type Tab = 'content' | 'html' | 'css' | 'jsonld' | 'extras' | 'preview';
const TAB_LABEL: [Tab, string][] = [['content', 'Content'], ['html', 'HTML'], ['css', 'CSS'], ['jsonld', 'JSON-LD'], ['extras', 'FAQ & sources']];

export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [type, setType] = useState<StarterType>('guide');
  const [form, setForm] = useState<Form>(() => blank('guide'));
  const [loaded, setLoaded] = useState(!id);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [authors, setAuthors] = useState<AdminAuthor[]>([]);
  const [posts, setPosts] = useState<{ id: string; slug: string; title: string }[]>([]);
  const [settings, setSettings] = useState<BlogSettings>(DEFAULT_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [split, setSplit] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  /** true once the content was edited, so changing the type no longer swaps the starter */
  const [touched, setTouched] = useState(false);
  const [picker, setPicker] = useState(false);
  const views = useRef<Partial<Record<'html' | 'css', EditorView>>>({});

  useEffect(() => {
    blogApi<{ categories: AdminCategory[] }>('/categories').then(d => setCats(d.categories)).catch(() => {});
    blogApi<{ authors: AdminAuthor[] }>('/authors').then(d => setAuthors(d.authors)).catch(() => {});
    blogApi<{ posts: { id: string; slug: string; title: string }[] }>('/posts').then(d => setPosts(d.posts)).catch(() => {});
    blogApi<{ settings: BlogSettings }>('/settings').then(d => setSettings(d.settings)).catch(() => {});
    if (id) {
      blogApi<{ post: ApiPost }>(`/posts/${id}`)
        .then(d => { setForm(toForm(d.post)); setUpdatedAt(d.post.updatedAt); setLoaded(true); })
        .catch(e => setMsg({ ok: false, text: e.message }));
    }
  }, [id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm(f => ({ ...f, [k]: v })); setDirty(true); setMsg(null);
    if (k === 'body' || k === 'takeaways' || k === 'faqs') setTouched(true);
  };

  /** New posts only: load the starter layout for another type, asking first once the content was edited. */
  const changeType = (t: StarterType) => {
    if (touched && !window.confirm(`Replace the content with the ${STARTER_LABEL[t].toLowerCase()} layout? Your current content will be replaced.`)) return;
    setType(t);
    setForm(f => ({ ...f, ...starter(t) }));
    setTouched(false); setDirty(true);
  };

  const save = useCallback(async (override?: Partial<Form>) => {
    const f = { ...form, ...override };
    if (!f.title.trim()) { setMsg({ ok: false, text: 'Title is required' }); return; }
    if (f.jsonLd.trim()) {
      try { const v = JSON.parse(f.jsonLd); if (typeof v !== 'object' || v === null) throw new Error(); }
      catch { setMsg({ ok: false, text: 'JSON-LD is not valid JSON' }); setTab('jsonld'); return; }
    }
    setSaving(true); setMsg(null);
    try {
      const body = toPayload(f);
      const { post } = id
        ? await blogApi<{ post: ApiPost }>(`/posts/${id}`, { method: 'PATCH', json: body })
        : await blogApi<{ post: ApiPost }>('/posts', { method: 'POST', json: body });
      setForm(toForm(post)); setUpdatedAt(post.updatedAt); setDirty(false);
      setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
      if (!id) router.replace(`/admin/blog/${post.id}`);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setSaving(false); }
  }, [form, id, router]);

  // Ctrl/⌘+S saves; warn before leaving with unsaved changes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onLeave); };
  }, [save, dirty]);

  const remove = async () => {
    if (!id || !window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    try { await blogApi(`/posts/${id}`, { method: 'DELETE' }); setDirty(false); router.push('/admin/blog'); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  };

  const titles = useMemo(() => Object.fromEntries(posts.map(p => [p.slug, p.title])), [posts]);
  const isHtml = htmlOnly(form.body);
  const generatedHtml = useMemo(() => (isHtml || tab !== 'html' ? '' : blocksToHtml(cleanBlocks(form.body), titles)), [isHtml, tab, form.body, titles]);

  /** Blocks → one hand-editable HTML block holding the HTML the blocks produce now. */
  const editHtmlByHand = () => {
    if (!window.confirm('Edit the article body as HTML? The blocks become one HTML document you edit directly. You can still add blocks around it later in the Content tab.')) return;
    set('body', [{ type: 'html', html: blocksToHtml(cleanBlocks(form.body), titles) }]);
  };

  /** "+ Image": insert at the cursor in the HTML or CSS editor. */
  const onPicked = (m: Media) => {
    const which = tab === 'css' ? 'css' : 'html';
    const url = mediaUrl(m.url);
    const snippet = which === 'css' ? `url("${url}")` : `<figure>\n  <img src="${url}" alt="${m.alt}" loading="lazy">\n  <figcaption></figcaption>\n</figure>`;
    const view = views.current[which];
    if (view) {
      const { from, to } = view.state.selection.main;
      view.dispatch({ changes: { from, to, insert: snippet }, selection: { anchor: from + snippet.length } });
      view.focus();
    } else if (which === 'css') set('customCss', form.customCss + '\n' + snippet);
    else if (isHtml) set('body', [{ type: 'html', html: (form.body[0] as { html: string }).html + '\n' + snippet }]);
    setPicker(false);
  };

  // Preview data in the same shape the public page gets from the API
  const preview = useMemo((): { post: PostFull; linked: PostCard[] } => {
    const p = toPayload(form);
    const ref = (au?: AdminAuthor) => (au ? { slug: au.slug, name: au.name, role: au.role, bio: au.bio, avatarUrl: au.avatarUrl, linkedinUrl: au.linkedinUrl } : null);
    const cat = cats.find(c => c.id === form.categoryId);
    const words = JSON.stringify(p.body).split(/\s+/).length;
    const now = new Date().toISOString();
    return {
      post: {
        id: id ?? 'new', slug: slugify(p.slug) || 'preview', title: p.title, excerpt: p.excerpt, description: p.description,
        seoTitle: null, seoDescription: null, coverImage: p.coverImage || null, coverAlt: p.coverAlt || null, coverCaption: p.coverCaption || null,
        customCss: null, jsonLd: null,
        readMinutes: p.readMinutes || Math.max(1, Math.round(words / 220)), featured: p.featured, tags: p.tags.map(slugify),
        publishedAt: p.publishedAt ?? now, updatedAt: updatedAt ?? now,
        category: cat ? { slug: cat.slug, name: cat.name } : null,
        author: ref(authors.find(x => x.id === form.authorId)), reviewer: ref(authors.find(x => x.id === form.reviewerId)),
        takeaways: p.takeaways, body: p.body, faqs: p.faqs as [string, string][], sources: p.sources,
      },
      linked: posts.map(x => ({ slug: x.slug, title: x.title }) as PostCard),
    };
  }, [form, cats, authors, posts, id, updatedAt]);

  const liveUrl = form.slug ? `/blog/${form.slug}` : null;
  const postOptions = posts.filter(p => p.id !== id);
  const jsonLdError = form.jsonLd.trim() && parseJsonLd(form.jsonLd).length === 0;

  if (!loaded) return <p className={a.hint}>{msg?.text ?? 'Loading…'}</p>;

  const contentPane = (
    <div className={a.form}>
      <div className={a.sectionTitle}>Key takeaways</div>
      <textarea value={form.takeaways} onChange={e => set('takeaways', e.target.value)} placeholder="One takeaway per line (shown in a box at the top of the article)" />
      <div className={a.sectionTitle}>Article body</div>
      {isHtml && <p className={a.hint}>This article body is hand-written HTML. Edit it in the <button type="button" className={a.linkBtn} onClick={() => setTab('html')}>HTML tab</button>, or add blocks around it below.</p>}
      <BlockEditor blocks={form.body} onChange={b => set('body', b)} posts={postOptions} />
      <p className={a.hint}>Inline links in any text: <code>[anchor text](/blog/other-post)</code> or <code>[text](https://…)</code>. H2 headings appear in “On this page”.</p>
    </div>
  );

  const htmlPane = isHtml ? (
    <div className={a.form}>
      <CodeField lang="html" value={(form.body[0] as { html: string }).html} onChange={v => set('body', [{ type: 'html', html: v }])} onView={v => { views.current.html = v; }} />
      <p className={a.hint}>Plain tags are styled like the blocks: <code>&lt;h2 id=&quot;…&quot;&gt;</code> (listed in “On this page”), <code>&lt;table&gt;</code>, <code>&lt;blockquote&gt;</code>, <code>&lt;ol class=&quot;steps&quot;&gt;</code>, <code>&lt;figure&gt;&lt;img&gt;&lt;figcaption&gt;</code>, <code>&lt;a class=&quot;related&quot;&gt;</code>.</p>
    </div>
  ) : (
    <div className={a.form}>
      <div className={a.htmlBar}>
        <span className={a.hint}>This HTML is generated from the blocks and updates as you edit them.</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={editHtmlByHand}>Edit HTML by hand</button>
      </div>
      <CodeField lang="html" value={generatedHtml} readOnly />
    </div>
  );

  const cssPane = (
    <div className={a.form}>
      <CodeField lang="css" value={form.customCss} onChange={v => set('customCss', v)} onView={v => { views.current.css = v; }} />
      <p className={a.hint}>Added to this post’s page only (the preview shows it too). Site-wide blog CSS is under <Link href="/admin/blog/settings">Blog page</Link>.</p>
    </div>
  );

  const jsonPane = (
    <div className={a.form}>
      <CodeField lang="json" value={form.jsonLd} onChange={v => set('jsonLd', v)} />
      {jsonLdError ? <p className={a.error}>Not valid JSON yet.</p> : null}
      <p className={a.hint}>Extra structured data added to the page, e.g. <code>{'{"@context":"https://schema.org","@type":"HowTo", …}'}</code>. BlogPosting, BreadcrumbList and FAQPage are generated automatically.</p>
    </div>
  );

  const extrasPane = (
    <div className={a.form}>
      <div className={a.sectionTitle}>FAQ <span className={a.hint}>(adds FAQPage structured data)</span></div>
      {form.faqs.map(([q, ans], i) => (
        <div key={i} className={a.block}>
          <div className={a.blockHead}>
            <span className={a.blockType}>Question {i + 1}</span>
            <button type="button" className={a.iconBtn} disabled={i === 0} onClick={() => { const n = [...form.faqs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set('faqs', n); }}>↑</button>
            <button type="button" className={a.iconBtn} disabled={i === form.faqs.length - 1} onClick={() => { const n = [...form.faqs]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set('faqs', n); }}>↓</button>
            <button type="button" className={`${a.iconBtn} ${a.iconDanger}`} onClick={() => set('faqs', form.faqs.filter((_, j) => j !== i))}>✕</button>
          </div>
          <input value={q} placeholder="Question" onChange={e => set('faqs', form.faqs.map((f, j) => (j === i ? [e.target.value, f[1]] : f)))} />
          <textarea value={ans} placeholder="Answer" onChange={e => set('faqs', form.faqs.map((f, j) => (j === i ? [f[0], e.target.value] : f)))} />
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('faqs', [...form.faqs, ['', '']])}>+ Add question</button>

      <div className={a.sectionTitle}>Sources</div>
      <textarea value={form.sources} onChange={e => set('sources', e.target.value)} placeholder={'One per line:  Label | https://link'} />
      <span className={a.hint}>Cited sources shown under the article.</span>
    </div>
  );

  const previewPane = (
    <PreviewFrame mobile={mobile} css={form.customCss}>
      <PostArticle post={preview.post} linked={preview.linked} settings={settings} url={`https://serpsupport.com/blog/${preview.post.slug}`} />
    </PreviewFrame>
  );

  const panes: Record<Exclude<Tab, 'preview'>, React.ReactNode> = { content: contentPane, html: htmlPane, css: cssPane, jsonld: jsonPane, extras: extrasPane };
  const canInsertImage = tab === 'css' || (tab === 'html' && isHtml);

  return (
    <>
      <div className={a.head}>
        <h1>{id ? form.title || 'Untitled' : 'New post'}</h1>
        <div className={a.savebar}>
          {msg && <span className={msg.ok ? a.ok : a.error}>{msg.text}</span>}
          {dirty && !msg && <span className={a.hint}>Unsaved changes</span>}
          {id && liveUrl && form.status === 'PUBLISHED' && <a className="btn btn-secondary btn-sm" href={liveUrl} target="_blank" rel="noreferrer">Open on site ↗</a>}
          {id && <button type="button" className="btn btn-danger btn-sm" onClick={remove}>Delete</button>}
          {form.status === 'DRAFT'
            ? <><button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => save()}>Save draft</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => save({ status: 'PUBLISHED' })}>Publish</button></>
            : <><button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => save({ status: 'DRAFT' })}>Unpublish</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => save()}>Update</button></>}
        </div>
      </div>

      <div className={a.editor}>
        <div className={`${a.meta} ${a.form}`}>
          <label>Title<input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Primary keyword first, ≤ 70 characters" /></label>
          <div className={a.two}>
            {!id && (
              <label>Type
                <select value={type} onChange={e => changeType(e.target.value as StarterType)}>
                  {(Object.keys(STARTER_LABEL) as StarterType[]).map(t => <option key={t} value={t}>{STARTER_LABEL[t]}</option>)}
                </select>
              </label>
            )}
            <label>Status
              <select value={form.status} onChange={e => set('status', e.target.value as Status)}>
                <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option>
              </select>
            </label>
            {id && <label>Publish date<input type="datetime-local" value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} /></label>}
          </div>
          {!id && <span className={a.hint} style={{ marginTop: -6 }}>Type sets up a starter layout of sections for the article. Change it before you start writing.</span>}
          {!id && <label>Publish date<input type="datetime-local" value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} /></label>}
          <span className={a.hint} style={{ marginTop: -6 }}>A future date schedules the post: it goes live then.</span>
          <label>Slug<input value={form.slug} placeholder={slugify(form.title) || 'from title'} onChange={e => set('slug', e.target.value)} />
            <span className={a.hint}>/blog/{slugify(form.slug || form.title) || '…'}</span></label>
          <label>Excerpt<textarea style={{ minHeight: 64 }} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
            <span className={a.hint}>Used on cards and in search results.</span></label>
          <label>Intro (dek)<textarea style={{ minHeight: 76 }} value={form.description} onChange={e => set('description', e.target.value)} />
            <span className={a.hint}>Shown under the title. Also the meta description unless one is set below (150–160 characters).</span></label>
          <div className={a.two}>
            <label>Category
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">—</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Author
              <select value={form.authorId} onChange={e => set('authorId', e.target.value)}>
                <option value="">—</option>{authors.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
          </div>
          <ImageField label="Cover image" value={form.coverImage} onChange={(v, m) => { set('coverImage', v); if (m?.alt && !form.coverAlt) set('coverAlt', m.alt); }} hint="1200×630 works best. Also used as the social sharing image." />

          <fieldset>
            <legend>Card details</legend>
            <div className={a.two}>
              <label>Reviewed by
                <select value={form.reviewerId} onChange={e => set('reviewerId', e.target.value)}>
                  <option value="">—</option>{authors.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label>Read time (min)<input type="number" min={1} value={form.readMinutes} placeholder="auto" onChange={e => set('readMinutes', e.target.value)} /></label>
            </div>
            <label>Cover alt text<input value={form.coverAlt} onChange={e => set('coverAlt', e.target.value)} /></label>
            <label>Cover caption<input value={form.coverCaption} onChange={e => set('coverCaption', e.target.value)} /></label>
            <label className={a.check}><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />Featured on the blog home</label>
          </fieldset>

          <fieldset>
            <legend>SEO</legend>
            <label>SEO title<input value={form.seoTitle} placeholder={`${form.title || 'Title'} | SERPsupport`} onChange={e => set('seoTitle', e.target.value)} /></label>
            <label>Meta description<textarea style={{ minHeight: 64 }} value={form.seoDescription} placeholder="Defaults to the intro" onChange={e => set('seoDescription', e.target.value)} />
              <span className={a.hint}>{(form.seoDescription || form.description).length} characters</span></label>
            <label>Tags<input value={form.tags} placeholder="anchor-text, outreach" onChange={e => set('tags', e.target.value)} /><span className={a.hint}>Comma separated</span></label>
            <span className={a.hint}>Structured data (JSON-LD) is edited in its own tab.</span>
          </fieldset>
        </div>

        <div className={a.work}>
          <div className={a.tabs} role="tablist">
            {TAB_LABEL.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
            {!split && <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>}
            <span className={a.spacer} />
            {canInsertImage && <button type="button" onClick={() => setPicker(true)} title="Upload or pick an image and insert it at the cursor">+ Image</button>}
            <button type="button" onClick={() => { setSplit(!split); if (tab === 'preview') setTab('content'); }}>{split ? 'Full-width editor' : 'Side-by-side preview'}</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(!mobile)}>{mobile ? 'Mobile' : 'Desktop'} preview</button>
          </div>
          <div className={`${a.split} ${split ? a.splitSide : ''}`}>
            {tab === 'preview' ? previewPane : <div>{panes[tab]}</div>}
            {split && previewPane}
          </div>
          <p className={a.hint}>Ctrl/⌘+S saves. Drafts and scheduled posts are not visible on the site. <Link href="/admin/blog/media">Media library</Link></p>
        </div>
      </div>

      {picker && <MediaPicker onPick={onPicked} onClose={() => setPicker(false)} />}
    </>
  );
}

/** Renders the real article at desktop width (1280px), scaled down to fit the pane. */
function PreviewFrame({ mobile, css, children }: { mobile: boolean; css?: string; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);
  const width = mobile ? 390 : 1280;
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, (el.clientWidth - 2) / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={box} className={`${a.preview} ${mobile ? a.previewMobile : ''}`}>
      {css && <style dangerouslySetInnerHTML={styleHtml(css)} />}
      <div style={{ width, zoom }} className={`${blogStyles.root} ${blogFontVars}`} onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
        {children}
      </div>
    </div>
  );
}
