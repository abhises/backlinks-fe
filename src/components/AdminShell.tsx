'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield, LayoutDashboard, Settings, Bell,
  LogOut, Sun, Moon, Palette, Menu, X, Globe
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Shield, label: 'Users' },
  { href: '/admin/backlinks', icon: Globe, label: 'Backlinks' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const THEMES = ['dark', 'light', 'color'] as const;
type Theme = typeof THEMES[number];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as Theme) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth'); return; }
    if (user.role !== 'ADMIN') { router.replace('/dashboard'); return; }
  }, [user, loading, router]);

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Palette;

  if (loading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--red), var(--amber))', boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)' }}>
            <Shield size={17} color="#fff" />
          </div>
          <span className="logo-text">Admin Panel</span>
        </div>

        {/* Nav links */}
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        {/* Bottom controls */}
        <button 
          onClick={logout} 
          className="nav-item" 
          style={{ 
            color: 'var(--red)', 
            background: 'none', 
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            marginTop: 8,
            transition: 'background 0.15s ease, border-color 0.15s ease'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Mobile: sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 198,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Mobile: sidebar slide-in overlay */}
      <aside
        className="mobile-sidebar-overlay"
        style={{
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none',
        }}
        aria-hidden={!sidebarOpen}
      >
        <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon" style={{ background: 'linear-gradient(135deg, var(--red), var(--amber))' }}>
              <Shield size={17} color="#fff" />
            </div>
            <span className="logo-text">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn-ghost btn-icon"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => { setSidebarOpen(false); logout(); }}
          className="nav-item"
          style={{
            color: 'var(--red)', background: 'none',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
            textAlign: 'left', cursor: 'pointer', marginTop: 8,
            transition: 'background 0.15s ease, border-color 0.15s ease'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.12)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: '100%' }}>
        {/* Sticky Top Header Bar */}
        <header style={{ 
          height: '60px', 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-surface)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 24px', 
          flexShrink: 0,
          zIndex: 100 
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              id="mobile-sidebar-toggle"
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(v => !v)}
              style={{ padding: 6, height: 34, width: 34 }}
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin System</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {pathname?.split('/')[2] ? pathname.split('/')[2].charAt(0).toUpperCase() + pathname.split('/')[2].slice(1) : 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="btn btn-secondary btn-icon"
              title="Cycle Theme"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, padding: 0, borderRadius: 'var(--radius-sm)' }}
            >
              <ThemeIcon size={16} />
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
