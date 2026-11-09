'use client';
/* eslint-disable @next/next/no-img-element -- admin thumbnails */
import { useCallback, useEffect, useState } from 'react';
import { type AdminAuthor, ImageField, blogApi } from '@/components/admin/blog/shared';
import { initials, mediaUrl } from '@/lib/blog';
import a from '@/components/admin/blog/adminBlog.module.css';

const blank = { id: '', name: '', slug: '', role: '', bio: '', avatarUrl: '', linkedinUrl: '', sortOrder: 0 };
type Edit = typeof blank;

export default function AdminBlogAuthorsPage() {
  const [rows, setRows] = useState<AdminAuthor[]>([]);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => blogApi<{ authors: AdminAuthor[] }>('/authors').then(d => setRows(d.authors)).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError('');
    const { id, ...body } = edit;
    try {
      await blogApi(id ? `/authors/${id}` : '/authors', { method: id ? 'PATCH' : 'POST', json: body });
      setEdit(null); load();
    } catch (err) { setError((err as Error).message); }
  };
  const remove = async (x: AdminAuthor) => {
    if (!window.confirm(`Delete author "${x.name}"? Their ${x._count?.posts ?? 0} posts will be left without an author.`)) return;
    try { await blogApi(`/authors/${x.id}`, { method: 'DELETE' }); load(); } catch (err) { setError((err as Error).message); }
  };
  const f = (k: keyof Edit) => ({ value: edit![k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit({ ...edit!, [k]: e.target.value }) });

  return (
    <>
      <div className={a.head}><h1>Authors</h1><button className="btn btn-primary btn-sm" onClick={() => setEdit({ ...blank, sortOrder: rows.length })}>+ New author</button></div>
      {edit && (
        <form className={`${a.card} ${a.form}`} style={{ marginBottom: 16, maxWidth: 760 }} onSubmit={save}>
          <div className={a.two}><label>Name<input required {...f('name')} /></label><label>Slug<input placeholder="from name" {...f('slug')} /></label></div>
          <label>Role<input placeholder="Head of Outreach, SERPsupport" {...f('role')} /></label>
          <div className={a.avatarField}>
            {edit.avatarUrl ? <img src={mediaUrl(edit.avatarUrl)} alt="" className={a.avatarImg} /> : <span className={a.avatarImg} aria-hidden="true" />}
            <div style={{ flex: 1 }} className={a.form}>
              <ImageField label="Photo" value={edit.avatarUrl} onChange={v => setEdit({ ...edit, avatarUrl: v })} hint="Square photos look best. Without a photo the initials are shown." />
            </div>
          </div>
          <label>LinkedIn profile<input type="url" placeholder="https://www.linkedin.com/in/…" {...f('linkedinUrl')} /></label>
          <label>Bio<textarea {...f('bio')} /><span className={a.hint}>Shown in the “Written by” box under each article.</span></label>
          <label style={{ maxWidth: 160 }}>Sort order<input type="number" value={edit.sortOrder} onChange={e => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></label>
          {error && <p className={a.error}>{error}</p>}
          <div className={a.savebar}><button className="btn btn-primary btn-sm">Save</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {!edit && error && <p className={a.error}>{error}</p>}
      <table className={a.table}>
        <thead><tr><th></th><th>Name</th><th>Role</th><th>Posts</th><th></th></tr></thead>
        <tbody>{rows.map(x => (
          <tr key={x.id}>
            <td style={{ width: 56 }}>
              {x.avatarUrl
                ? <img src={mediaUrl(x.avatarUrl)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-hover)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{initials(x.name)}</span>}
            </td>
            <td className={a.main}><strong>{x.name}</strong><div className={a.hint}>/blog?author={x.slug}</div></td>
            <td>{x.role}</td>
            <td>{x._count?.posts ?? 0}</td>
            <td className={a.end}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ id: x.id, name: x.name, slug: x.slug, role: x.role, bio: x.bio, avatarUrl: x.avatarUrl ?? '', linkedinUrl: x.linkedinUrl ?? '', sortOrder: x.sortOrder })}>Edit</button>{' '}
              <button className="btn btn-danger btn-sm" onClick={() => remove(x)}>Delete</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5}>No authors yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
