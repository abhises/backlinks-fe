'use client';
import { Fragment, useState } from 'react';
import type { Block, BlockType } from '@/lib/blog';
import { ImageField, slugify } from './shared';
import a from './adminBlog.module.css';

export const BLOCK_LABEL: Record<BlockType, string> = {
  p: 'Paragraph', h2: 'Heading (H2)', h3: 'Subheading (H3)', ul: 'Bullet list', table: 'Table', quote: 'Quote',
  related: 'Related post', steps: 'Numbered steps', image: 'Image', figure: 'Placeholder figure', html: 'Custom HTML',
};
const ADDABLE: BlockType[] = ['p', 'h2', 'h3', 'ul', 'steps', 'table', 'quote', 'image', 'related', 'html'];

export function newBlock(type: BlockType): Block {
  switch (type) {
    case 'p': return { type, text: '' };
    case 'h2': return { type, id: '', text: '' };
    case 'h3': return { type, text: '' };
    case 'ul': return { type, items: [''] };
    case 'table': return { type, head: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'quote': return { type, text: '', cite: '' };
    case 'related': return { type, slug: '' };
    case 'steps': return { type, items: [['', '']] };
    case 'image': return { type, src: '', alt: '', caption: '' };
    case 'figure': return { type, label: '', caption: '' };
    case 'html': return { type, html: '' };
  }
}

// Line-based text fields: keep empty lines while typing, clean up on save (see cleanBlocks).
const lines = (s: string) => s.split('\n');
const cells = (s: string) => s.split('|');

/** Trim and drop empty bits before saving; give headings an anchor id. */
export function cleanBlocks(blocks: Block[]): Block[] {
  const used = new Set<string>();
  return blocks.map((b): Block => {
    switch (b.type) {
      case 'h2': {
        let id = slugify(b.id || b.text) || 'section';
        while (used.has(id)) id += '-2';
        used.add(id);
        return { ...b, id, text: b.text.trim(), toc: b.toc?.trim() || undefined };
      }
      case 'ul': return { ...b, items: b.items.map(s => s.trim()).filter(Boolean) };
      case 'steps': return { ...b, items: b.items.map(([t, d]) => [t.trim(), (d ?? '').trim()] as [string, string]).filter(([t, d]) => t || d) };
      case 'table': {
        const head = b.head.map(s => s.trim());
        return { ...b, head, rows: b.rows.map(r => r.map(s => s.trim())).filter(r => r.some(Boolean)) };
      }
      default: return b;
    }
  }).filter(b => !(
    (b.type === 'p' && !b.text.trim()) || (b.type === 'h3' && !b.text.trim()) || (b.type === 'h2' && !b.text) ||
    (b.type === 'ul' && !b.items.length) || (b.type === 'image' && !b.src) || (b.type === 'related' && !b.slug) ||
    (b.type === 'html' && !b.html.trim())
  ));
}

type PostOption = { slug: string; title: string };

function BlockFields({ b, set, posts }: { b: Block; set: (b: Block) => void; posts: PostOption[] }) {
  switch (b.type) {
    case 'p': return (
      <textarea value={b.text} onChange={e => set({ ...b, text: e.target.value })} placeholder="Write a paragraph… Links: [anchor text](/blog/some-post)" />
    );
    case 'h2': return (
      <>
        <input value={b.text} onChange={e => set({ ...b, text: e.target.value })} placeholder="Section heading" style={{ fontWeight: 600 }} />
        <div className={a.two}>
          <input value={b.toc ?? ''} onChange={e => set({ ...b, toc: e.target.value })} placeholder="Short label in “On this page” (optional)" />
          <input value={b.id} onChange={e => set({ ...b, id: e.target.value })} placeholder={`#${slugify(b.text) || 'anchor-id'}`} />
        </div>
      </>
    );
    case 'h3': return <input value={b.text} onChange={e => set({ ...b, text: e.target.value })} placeholder="Subheading" style={{ fontWeight: 600 }} />;
    case 'ul': return (
      <>
        <textarea value={b.items.join('\n')} onChange={e => set({ ...b, items: lines(e.target.value) })} placeholder={'One bullet per line'} />
      </>
    );
    case 'steps': return (
      <>
        <textarea value={b.items.map(([t, d]) => (d ? `${t}|${d}` : t)).join('\n')}
          onChange={e => set({ ...b, items: lines(e.target.value).map(l => { const [t, ...d] = cells(l); return [t, d.join('|')] as [string, string]; }) })}
          placeholder={'One step per line:  Step title | Short description'} />
        <span className={a.hint}>One step per line. Title and description separated by “|”.</span>
      </>
    );
    case 'table': return (
      <>
        <input value={b.head.join('|')} onChange={e => set({ ...b, head: cells(e.target.value) })} placeholder="Header 1 | Header 2 | Header 3" style={{ fontWeight: 600 }} />
        <textarea className={a.code} value={b.rows.map(r => r.join('|')).join('\n')} onChange={e => set({ ...b, rows: lines(e.target.value).map(cells) })} placeholder={'Cell | Cell | Cell\nCell | Cell | Cell'} />
        <span className={a.hint}>First line is the header. One row per line, cells separated by “|”.</span>
      </>
    );
    case 'quote': return (
      <>
        <textarea value={b.text} onChange={e => set({ ...b, text: e.target.value })} placeholder="Quote (without quotation marks)" />
        <input value={b.cite} onChange={e => set({ ...b, cite: e.target.value })} placeholder="Who said it, e.g. Daniel Okafor, Technical SEO" />
      </>
    );
    case 'related': return (
      <select value={b.slug} onChange={e => set({ ...b, slug: e.target.value })}>
        <option value="">Choose a post…</option>
        {posts.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
      </select>
    );
    case 'image': return (
      <>
        <ImageField label="" value={b.src} onChange={(src, m) => set({ ...b, src, alt: b.alt || m?.alt || '' })} />
        <div className={a.two}>
          <input value={b.alt} onChange={e => set({ ...b, alt: e.target.value })} placeholder="Alt text (describe the image)" />
          <input value={b.caption ?? ''} onChange={e => set({ ...b, caption: e.target.value })} placeholder="Caption (optional)" />
        </div>
      </>
    );
    case 'figure': return (
      <>
        <input value={b.label} onChange={e => set({ ...b, label: e.target.value })} placeholder="Placeholder label" />
        <input value={b.caption} onChange={e => set({ ...b, caption: e.target.value })} placeholder="Caption" />
        <span className={a.hint}>Striped placeholder from the design. Replace it with an Image block once you have a screenshot.</span>
      </>
    );
    case 'html': return (
      <>
        <textarea className={a.code} value={b.html} onChange={e => set({ ...b, html: e.target.value })} placeholder="<iframe …> or any HTML" />
        <span className={a.hint}>Rendered as-is. Use for embeds (YouTube, tweets, forms).</span>
      </>
    );
  }
}

function AddBar({ onAdd, label = 'Add block:' }: { onAdd: (t: BlockType) => void; label?: string }) {
  return (
    <div className={a.addBar}>
      <span>{label}</span>
      {ADDABLE.map(t => <button key={t} type="button" onClick={() => onAdd(t)}>+ {BLOCK_LABEL[t]}</button>)}
    </div>
  );
}

export function BlockEditor({ blocks, onChange, posts }: { blocks: Block[]; onChange: (b: Block[]) => void; posts: PostOption[] }) {
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const update = (i: number, b: Block) => onChange(blocks.map((x, j) => (j === i ? b : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...blocks];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const insert = (at: number, t: BlockType) => {
    onChange([...blocks.slice(0, at), newBlock(t), ...blocks.slice(at)]);
    setInsertAt(null);
  };
  const remove = (i: number) => {
    const b = blocks[i];
    const empty = JSON.stringify(b) === JSON.stringify(newBlock(b.type));
    if (!empty && !window.confirm(`Remove this ${BLOCK_LABEL[b.type].toLowerCase()}?`)) return;
    onChange(blocks.filter((_, j) => j !== i));
  };

  return (
    <div className={`${a.blocks} ${a.form}`}>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          {insertAt === i
            ? <AddBar label="Insert here:" onAdd={t => insert(i, t)} />
            : i > 0 && <button type="button" className={a.insertHere} onClick={() => setInsertAt(i)}>+ insert block here</button>}
          <div className={a.block}>
            <div className={a.blockHead}>
              <span className={a.blockType}>{BLOCK_LABEL[b.type]}</span>
              <button type="button" className={a.iconBtn} title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className={a.iconBtn} title="Move down" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className={`${a.iconBtn} ${a.iconDanger}`} title="Remove" onClick={() => remove(i)}>✕</button>
            </div>
            <BlockFields b={b} set={nb => update(i, nb)} posts={posts} />
          </div>
        </Fragment>
      ))}
      <AddBar onAdd={t => insert(blocks.length, t)} />
    </div>
  );
}
