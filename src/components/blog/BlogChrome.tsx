'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import s from '@/app/blog/blog.module.css';

export function BlogHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const onBlog = pathname?.startsWith('/blog');
  return (
    <header className={s.header}>
      <div className={`${s.wrap} ${s.headerInner}`}>
        <Link href="/" className={s.brand}>SERPSUPPORT</Link>
        <nav className={s.nav} aria-label="Main">
          <Link href="/#features">Features</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/blog" className={onBlog ? s.navActive : undefined}>Blog</Link>
        </nav>
        <div className={s.spacer} />
        {user
          ? <Link href="/inbox" className={s.btnDark}>Go to dashboard</Link>
          : <Link href="/auth?mode=register" className={s.btnDark}>Get started</Link>}
      </div>
    </header>
  );
}

export function BlogFooter({ title, text }: { title: string; text: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  // No newsletter backend yet: hand the subscription request to the user's mail client.
  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const subject = encodeURIComponent('Newsletter subscription');
    const body = encodeURIComponent(`Please subscribe ${email} to the SERPsupport newsletter.`);
    window.location.href = `mailto:info@serpsupport.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section className={s.newsletter}>
      <div className={s.newsInner}>
        <div className={s.eyebrow}>Newsletter</div>
        <h2>{title}</h2>
        <p>{text}</p>
        <form className={s.newsForm} onSubmit={subscribe}>
          <input type="email" required placeholder="you@company.com" aria-label="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit">Subscribe →</button>
        </form>
        {sent && <p className={s.newsNote}>Your email app should open with the request. Send it and we’ll add you.</p>}
      </div>
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <span className={s.footerBrand}>SERPSUPPORT</span>
          <div className={s.spacer} />
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/blog">Blog</Link>
          <a href="/sitemap.xml">Sitemap</a>
          <span>© {new Date().getFullYear()} SERPsupport</span>
        </div>
      </footer>
    </section>
  );
}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div className={s.share}>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">LinkedIn</a>
      <a href={`https://x.com/intent/post?url=${u}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">X</a>
      <button type="button" onClick={copy} aria-label="Copy link">{copied ? 'Copied ✓' : 'Copy link'}</button>
    </div>
  );
}
