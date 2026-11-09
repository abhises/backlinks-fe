'use client';
import { useEffect, useState } from 'react';
import { CodeField } from '@/components/admin/blog/CodeField';
import { blogApi } from '@/components/admin/blog/shared';
import type { BlogSettings } from '@/lib/blog';
import a from '@/components/admin/blog/adminBlog.module.css';

type Form = Omit<BlogSettings, 'pillars' | 'customCss'> & { pillars: string; customCss: string };

export default function AdminBlogSettingsPage() {
  const [form, setForm] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    blogApi<{ settings: BlogSettings }>('/settings')
      .then(({ settings: s }) => setForm({ ...s, customCss: s.customCss ?? '', pillars: s.pillars.map(p => `${p.title} | ${p.href}`).join('\n') }))
      .catch(e => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!form) return <p className={msg ? a.error : a.hint}>{msg?.text ?? 'Loading…'}</p>;

  const f = (k: keyof Form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm({ ...form, [k]: e.target.value }); setMsg(null); } });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const pillars = form.pillars.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const i = l.lastIndexOf('|');
      return i < 0 ? { title: l, href: '/blog' } : { title: l.slice(0, i).trim(), href: l.slice(i + 1).trim() };
    });
    try {
      await blogApi('/settings', { method: 'PUT', json: { ...form, pillars } });
      setMsg({ ok: true, text: `Saved ${new Date().toLocaleTimeString()}` });
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={save}>
      <div className={a.head}>
        <h1>Blog page</h1>
        <div className={a.savebar}>
          {msg && <span className={msg.ok ? a.ok : a.error}>{msg.text}</span>}
          <a className="btn btn-secondary btn-sm" href="/blog" target="_blank" rel="noreferrer">View ↗</a>
          <button className="btn btn-primary btn-sm" disabled={saving}>Save</button>
        </div>
      </div>
      <div className={a.form} style={{ maxWidth: 860 }}>
        <fieldset>
          <legend>Blog home hero</legend>
          <label>Eyebrow<input {...f('eyebrow')} /></label>
          <label>Heading (H1)<input {...f('h1')} /></label>
          <label>Intro<textarea {...f('intro')} /></label>
        </fieldset>
        <fieldset>
          <legend>SEO for /blog</legend>
          <label>Title tag<input {...f('seoTitle')} /></label>
          <label>Meta description<textarea {...f('seoDescription')} /><span className={a.hint}>{form.seoDescription.length} characters</span></label>
        </fieldset>
        <fieldset>
          <legend>“Start here” box</legend>
          <div className={a.two}>
            <label>Title<input {...f('pillarsTitle')} /></label>
            <label>Text<input {...f('pillarsText')} /></label>
          </div>
          <label>Links<textarea className={a.code} {...f('pillars')} />
            <span className={a.hint}>One per line: Link text | /blog/post-slug. Leave empty to hide the box.</span></label>
        </fieldset>
        <fieldset>
          <legend>Article sidebar call to action</legend>
          <label>Title<input {...f('ctaTitle')} /></label>
          <label>Text<input {...f('ctaText')} /></label>
          <label>Button<input {...f('ctaButton')} /></label>
        </fieldset>
        <fieldset>
          <legend>Newsletter section</legend>
          <label>Title<input {...f('newsletterTitle')} /></label>
          <label>Text<input {...f('newsletterText')} /></label>
        </fieldset>
        <fieldset>
          <legend>Custom CSS (all blog pages)</legend>
          <CodeField lang="css" minHeight={220} value={form.customCss} onChange={v => { setForm({ ...form, customCss: v }); setMsg(null); }} />
          <span className={a.hint}>Added to /blog, category pages and every article. Per-post CSS is in each post’s CSS tab.</span>
        </fieldset>
      </div>
    </form>
  );
}
