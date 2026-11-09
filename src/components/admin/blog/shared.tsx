'use client';
/* eslint-disable @next/next/no-img-element -- admin thumbnails of uploaded images */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, Image as ImageIcon, LayoutGrid, type LucideIcon, PanelsTopLeft, UserRound } from 'lucide-react';
import api from '@/lib/api';
import { mediaUrl } from '@/lib/blog';
import a from './adminBlog.module.css';

// ─── API ────────────────────────────────────────────────────────────────────

type Opts = { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; json?: unknown };

/** Calls /api/admin/blog/*, throwing an Error with the server's message on failure. */
export async function blogApi<T>(path: string, { method = 'GET', json }: Opts = {}): Promise<T> {
  try {
    const res = await api.request<T>({ url: `/api/admin/blog${path}`, method, data: json });
    return res.data;
  } catch (e) {
    const err = e as { response?: { data?: { error?: string }; status?: number }; message: string };
    throw new Error(err.response?.data?.error || (err.response?.status === 413 ? 'File too large' : err.message));
  }
}

// ─── types (admin shapes) ───────────────────────────────────────────────────

export type AdminCategory = { id: string; slug: string; name: string; h1: string; intro: string; sortOrder: number; _count?: { posts: number } };
export type AdminAuthor = { id: string; slug: string; name: string; role: string; bio: string; avatarUrl: string | null; linkedinUrl: string | null; sortOrder: number; _count?: { posts: number } };
export type Media = { id: string; url: string; filename: string; mimeType: string; size: number; alt: string; createdAt: string };

export const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── sub navigation (second sidebar, BrasQ-style menu) ─────────────────────

type NavItem = { href: string; label: string };
type NavGroup = NavItem & { icon: LucideIcon; items?: NavItem[] };

const MENU: NavGroup[] = [
  { href: '/admin/blog', label: 'Posts', icon: FileText, items: [
    { href: '/admin/blog', label: 'All posts' },
    { href: '/admin/blog/new', label: 'Add new' },
  ] },
  { href: '/admin/blog/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/blog/authors', label: 'Authors', icon: UserRound },
  { href: '/admin/blog/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/blog/settings', label: 'Blog page', icon: PanelsTopLeft },
];

/** Which menu link is current: post editor pages (/admin/blog/<id>) belong to "Posts". */
function currentHref(path: string) {
  let best = '';
  for (const g of MENU)
    for (const l of [g, ...(g.items ?? [])])
      if ((path === l.href || path.startsWith(l.href + '/')) && l.href.length > best.length) best = l.href;
  return best;
}

export function BlogSideNav() {
  const path = usePathname();
  const current = currentHref(path);
  const isOpen = (g: NavGroup) => current === g.href || !!g.items?.some(i => i.href === current);
  return (
    <aside className={a.side}>
      <h2>Blog</h2>
      <nav className={a.sideNav} aria-label="Blog admin">
        {MENU.map(g => (
          <div key={g.href} className={`${a.grp} ${isOpen(g) ? a.grpOpen : ''}`}>
            <Link href={g.href} className={a.navLink} aria-current={isOpen(g) && !g.items ? 'page' : undefined}>
              <g.icon size={17} strokeWidth={1.9} />{g.label}
            </Link>
            {g.items && isOpen(g) && (
              <div className={a.subList}>
                {g.items.map(i => (
                  <Link key={i.href} href={i.href} className={a.subLink}
                    aria-current={i.href === current && (i.href !== '/admin/blog' || path === '/admin/blog') ? 'page' : undefined}>
                    {i.label}
                  </Link>
                ))}
                {current === '/admin/blog' && path !== '/admin/blog' && <span className={`${a.subLink} ${a.subCurrent}`}>Editing post</span>}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className={a.sideFoot}>
        <a href="/blog" target="_blank" rel="noreferrer" className={a.navLink}><ExternalLink size={17} strokeWidth={1.9} />View blog</a>
      </div>
    </aside>
  );
}

// ─── media ──────────────────────────────────────────────────────────────────

const readAsDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result as string);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(f);
});

export async function uploadFiles(files: File[]): Promise<Media[]> {
  const out: Media[] = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) throw new Error(`${f.name} is not an image`);
    if (f.size > 8 * 1024 * 1024) throw new Error(`${f.name} is larger than 8 MB`);
    const { media } = await blogApi<{ media: Media }>('/media', { method: 'POST', json: { filename: f.name, data: await readAsDataUrl(f) } });
    out.push(media);
  }
  return out;
}

/** Media library grid with upload. `onPick` turns it into a picker. */
export function MediaLibrary({ onPick }: { onPick?: (m: Media) => void }) {
  const [items, setItems] = useState<Media[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(() => blogApi<{ media: Media[] }>('/media').then(d => setItems(d.media)).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true); setError('');
    try {
      const added = await uploadFiles(files);
      setItems(prev => [...added, ...(prev ?? [])]);
      if (onPick && added.length === 1) onPick(added[0]);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const saveAlt = async (m: Media, alt: string) => {
    if (alt === m.alt) return;
    try { await blogApi(`/media/${m.id}`, { method: 'PATCH', json: { alt } }); setItems(p => p?.map(x => x.id === m.id ? { ...x, alt } : x) ?? null); }
    catch (e) { setError((e as Error).message); }
  };
  const remove = async (m: Media) => {
    if (!window.confirm(`Delete ${m.filename}? Posts that use this image will show a broken image.`)) return;
    try { await blogApi(`/media/${m.id}`, { method: 'DELETE' }); setItems(p => p?.filter(x => x.id !== m.id) ?? null); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <>
      <div
        className={`${a.drop} ${over ? a.dropActive : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); upload(Array.from(e.dataTransfer.files)); }}
      >
        {busy ? 'Uploading…' : 'Drop images here or click to upload (JPG, PNG, WebP, GIF, AVIF · max 8 MB)'}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden
          onChange={e => { upload(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </div>
      {error && <p className={a.error}>{error}</p>}
      {!items ? <p className={a.hint}>Loading…</p> : items.length === 0 ? <p className={a.hint}>No images yet.</p> : (
        <div className={a.mediaGrid}>
          {items.map(m => (
            <div key={m.id} className={a.mediaItem}>
              {onPick
                ? <button type="button" className={a.pick} onClick={() => onPick(m)} title="Use this image"><img src={mediaUrl(m.url)} alt={m.alt} /></button>
                : <img src={mediaUrl(m.url)} alt={m.alt} />}
              <div className={a.mediaMeta}>
                <span title={m.filename} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.filename} · {Math.round(m.size / 1024)} KB</span>
                <input className={a.input} defaultValue={m.alt} placeholder="Alt text" onBlur={e => saveAlt(m, e.target.value)} />
                {!onPick && (
                  <div className={a.row}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(mediaUrl(m.url))}>Copy URL</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(m)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function MediaPicker({ onPick, onClose }: { onPick: (m: Media) => void; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  // Portal: keeps the modal out of any surrounding <label>/<form>
  return createPortal(
    <div className={a.modal} onClick={onClose}>
      <div className={a.modalBox} onClick={e => e.stopPropagation()}>
        <div className={a.head}><h1 style={{ fontSize: '1.15rem' }}>Choose an image</h1><button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Close</button></div>
        <MediaLibrary onPick={onPick} />
      </div>
    </div>,
    document.body,
  );
}

/** URL input + "Pick" button + thumbnail. */
export function ImageField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string, m?: Media) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <label>
      {label}
      <span className={a.row}>
        <input value={value} placeholder="Pick or paste an image URL" onChange={e => onChange(e.target.value)} />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Pick</button>
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>✕</button>}
      </span>
      {value && <img src={mediaUrl(value)} alt="" className={a.thumb} />}
      {hint && <span className={a.hint}>{hint}</span>}
      {open && <MediaPicker onClose={() => setOpen(false)} onPick={m => { onChange(m.url, m); setOpen(false); }} />}
    </label>
  );
}
