'use client';
import { useCallback, useEffect, useState } from 'react';
import { type AdminCategory, blogApi } from '@/components/admin/blog/shared';
import a from '@/components/admin/blog/adminBlog.module.css';

const blank = { id: '', name: '', slug: '', h1: '', intro: '', sortOrder: 0 };
type Edit = typeof blank;

export default function AdminBlogCategoriesPage() {
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => blogApi<{ categories: AdminCategory[] }>('/categories').then(d => setRows(d.categories)).catch(e => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setError('');
    const { id, ...body } = edit;
    try {
      await blogApi(id ? `/categories/${id}` : '/categories', { method: id ? 'PATCH' : 'POST', json: body });
      setEdit(null); load();
    } catch (err) { setError((err as Error).message); }
  };
  const remove = async (c: AdminCategory) => {
    if (!window.confirm(`Delete category "${c.name}"? Its ${c._count?.posts ?? 0} posts will be left without a category.`)) return;
    try { await blogApi(`/categories/${c.id}`, { method: 'DELETE' }); load(); } catch (err) { setError((err as Error).message); }
  };
  const f = (k: keyof Edit) => ({ value: edit![k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit({ ...edit!, [k]: e.target.value }) });

  return (
    <>
      <div className={a.head}><h1>Categories</h1><button className="btn btn-primary btn-sm" onClick={() => setEdit({ ...blank, sortOrder: rows.length })}>+ New category</button></div>
      {edit && (
        <form className={`${a.card} ${a.form}`} style={{ marginBottom: 16, maxWidth: 680 }} onSubmit={save}>
          <div className={a.two}>
            <label>Name<input required {...f('name')} /></label>
            <label>Slug<input placeholder="from name" {...f('slug')} /><span className={a.hint}>/blog/category/{edit.slug || '…'}</span></label>
          </div>
          <label>Page heading (H1)<input placeholder={edit.name || 'Defaults to the name'} {...f('h1')} /></label>
          <label>Intro<textarea {...f('intro')} /><span className={a.hint}>Shown under the heading and used as the meta description.</span></label>
          <label style={{ maxWidth: 160 }}>Sort order<input type="number" value={edit.sortOrder} onChange={e => setEdit({ ...edit, sortOrder: Number(e.target.value) })} /></label>
          {error && <p className={a.error}>{error}</p>}
          <div className={a.savebar}><button className="btn btn-primary btn-sm">Save</button><button type="button" className="btn btn-secondary btn-sm" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {!edit && error && <p className={a.error}>{error}</p>}
      <table className={a.table}>
        <thead><tr><th>#</th><th>Name</th><th>URL</th><th>Posts</th><th></th></tr></thead>
        <tbody>{rows.map(c => (
          <tr key={c.id}>
            <td>{c.sortOrder}</td>
            <td className={a.main}><strong>{c.name}</strong><div className={a.hint}>{c.intro.slice(0, 140)}{c.intro.length > 140 ? '…' : ''}</div></td>
            <td>/blog/category/{c.slug}</td>
            <td>{c._count?.posts ?? 0}</td>
            <td className={a.end}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ id: c.id, name: c.name, slug: c.slug, h1: c.h1, intro: c.intro, sortOrder: c.sortOrder })}>Edit</button>{' '}
              <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={5}>No categories yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
