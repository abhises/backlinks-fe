'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { type AdminCategory, blogApi } from '@/components/admin/blog/shared';
import a from '@/components/admin/blog/adminBlog.module.css';

type Row = {
  id: string; slug: string; title: string; status: 'DRAFT' | 'PUBLISHED'; featured: boolean;
  publishedAt: string | null; updatedAt: string; readMinutes: number | null;
  category: { id: string; name: string } | null; author: { id: string; name: string } | null;
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function StatusPill({ p }: { p: Row }) {
  if (p.status === 'DRAFT') return <span className={`${a.pill} ${a.pillDraft}`}>Draft</span>;
  if (p.publishedAt && new Date(p.publishedAt) > new Date()) return <span className={`${a.pill} ${a.pillScheduled}`} title={new Date(p.publishedAt).toLocaleString()}>Scheduled</span>;
  return <span className={`${a.pill} ${a.pillPublished}`}>Published</span>;
}

export default function AdminBlogPostsPage() {
  const [posts, setPosts] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { blogApi<{ categories: AdminCategory[] }>('/categories').then(d => setCats(d.categories)).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      if (q) sp.set('q', q);
      if (status) sp.set('status', status);
      if (categoryId) sp.set('categoryId', categoryId);
      blogApi<{ posts: Row[] }>(`/posts?${sp}`).then(d => { setPosts(d.posts); setError(''); }).catch(e => setError(e.message));
    }, 200);
    return () => clearTimeout(t);
  }, [q, status, categoryId]);

  return (
    <>
      <div className={a.head}>
        <h1>Blog posts</h1>
        <Link href="/admin/blog/new" className="btn btn-primary btn-sm">+ New post</Link>
      </div>
      <div className={a.filters}>
        <input placeholder="Search title or slug" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Any status</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
        </select>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">All categories</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && <p className={a.error}>{error}</p>}
      {!posts ? <p className={a.hint}>Loading…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className={a.table}>
            <thead><tr><th>Title</th><th>Status</th><th>Category</th><th>Author</th><th>Published</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id}>
                  <td className={a.main}>
                    <Link href={`/admin/blog/${p.id}`}>{p.title}</Link>
                    {p.featured && <span className={a.pill} style={{ marginLeft: 6 }}>Featured</span>}
                    <div className={a.hint}>/blog/{p.slug}</div>
                  </td>
                  <td><StatusPill p={p} /></td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td>{p.author?.name ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(p.publishedAt)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(p.updatedAt)}</td>
                  <td className={a.end}>
                    <Link className="btn btn-secondary btn-sm" href={`/admin/blog/${p.id}`}>Edit</Link>{' '}
                    {p.status === 'PUBLISHED' && <a className="btn btn-ghost btn-sm" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">View ↗</a>}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={7}>No posts found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
