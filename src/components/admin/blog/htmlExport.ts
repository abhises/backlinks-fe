import type { Block } from '@/lib/blog';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes text and turns [anchor](href) into links, like RichText on the site. */
function rich(s: string) {
  return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
    href.startsWith('/') ? `<a href="${href}">${label}</a>` : `<a href="${href}" rel="noopener" target="_blank">${label}</a>`);
}

/**
 * Plain HTML for blocks. Used by the HTML tab (read-only view, and the starting point for
 * "Edit HTML by hand"). Classes `steps` / `related` get the block styling on the site.
 */
export function blocksToHtml(blocks: Block[], titles: Record<string, string> = {}): string {
  return blocks.map(b => {
    switch (b.type) {
      case 'p': return `<p>${rich(b.text)}</p>`;
      case 'h2': return `<h2 id="${esc(b.id)}"${b.toc ? ` data-toc="${esc(b.toc)}"` : ''}>${esc(b.text)}</h2>`;
      case 'h3': return `<h3>${esc(b.text)}</h3>`;
      case 'ul': return `<ul>\n${b.items.map(i => `  <li>${rich(i)}</li>`).join('\n')}\n</ul>`;
      case 'steps': return `<ol class="steps">\n${b.items.map(([t, d]) => `  <li><strong>${esc(t)}</strong>${d ? ` ${rich(d)}` : ''}</li>`).join('\n')}\n</ol>`;
      case 'table': return `<table>\n  <thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>\n  <tbody>\n${b.rows.map(r => `    <tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('\n')}\n  </tbody>\n</table>`;
      case 'quote': return `<blockquote>“${esc(b.text)}”${b.cite ? `<footer>${esc(b.cite)}</footer>` : ''}</blockquote>`;
      case 'related': return `<a class="related" href="/blog/${esc(b.slug)}">${esc(titles[b.slug] ?? b.slug)} →</a>`;
      case 'image': return `<figure>\n  <img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${b.caption ? `\n  <figcaption>${esc(b.caption)}</figcaption>` : ''}\n</figure>`;
      case 'figure': return `<figure>\n  <!-- placeholder: ${esc(b.label)} -->\n  <figcaption>${esc(b.caption)}</figcaption>\n</figure>`;
      case 'html': return b.html;
    }
  }).join('\n\n');
}
