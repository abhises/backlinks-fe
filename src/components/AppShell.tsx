'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Link2, Inbox, ExternalLink, LayoutDashboard,
  LogOut, Sun, Moon, Palette, ChevronDown, Globe
} from 'lucide-react';

const NAV = [
  { href: '/inbox',  icon: Inbox,           label: 'Inbox' },
  { href: '/links',  icon: ExternalLink,     label: 'Placed Links' },
  { href: '/discover', icon: LayoutDashboard, label: 'Discover' },
];

const THEMES = ['dark','light','color'] as const;
type Theme = typeof THEMES[number];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as Theme) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!workspace) { router.replace('/onboarding'); return; }
  }, [user, workspace, loading, router]);

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Palette;

  if (loading || !user || !workspace) return null;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Link2 size={17} color="#fff" /></div>
          <span className="logo-text">LinkLoop</span>
        </div>

        {/* Nav links */}
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <div style={{ flex:1 }} />

        {/* Workspace pill */}
        <div style={{ margin:'0 8px', padding:'12px', background:'var(--bg-hover)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <Globe size={13} color="var(--accent)" />
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--accent)' }}>{workspace.domain}</span>
          </div>
          <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', lineHeight:1.4 }}>{workspace.websiteName}</p>
        </div>

        {/* Bottom controls */}
        <div style={{ padding:'8px 8px 0', display:'flex', flexDirection:'column', gap:4 }}>
          <button onClick={cycleTheme} className="nav-item" style={{ width:'100%' }}>
            <ThemeIcon size={18} />
            {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Vibrant'} Theme
          </button>
          <button onClick={logout} className="nav-item" style={{ width:'100%', color:'var(--red)' }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
