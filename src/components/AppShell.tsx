'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox, LayoutDashboard, Settings, LogOut, Sun, Moon, Palette,
  Bell, Menu, X, ArrowDownLeft, ArrowUpRight, Sparkles
} from 'lucide-react';
import { io } from 'socket.io-client';

type NotificationItem = {
  id: string;
  type: 'new_message' | 'new_connection' | 'connection_accepted' | 'connection_rejected' | 'link_placed';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  link: string;
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

const NAV = [
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/inbox?filter=in', icon: ArrowDownLeft, label: 'Backlinks In' },
  { href: '/inbox?filter=out', icon: ArrowUpRight, label: 'Backlinks Out' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/#how-it-works', icon: Sparkles, label: 'How it works' },
];

const THEMES = ['dark', 'light', 'color'] as const;
type Theme = typeof THEMES[number];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('dark');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    window.dispatchEvent(new CustomEvent('bl_search', { detail: val }));
  };

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as Theme) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth'); return; }
    if (user.role === 'ADMIN') { router.replace('/admin/dashboard'); return; }
    if (!workspace) { router.replace('/onboarding'); return; }
  }, [user, workspace, loading, router]);

  useEffect(() => {
    if (!workspace?.id) return;
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(socketUrl);
    socket.emit('joinWorkspace', workspace.id);

    socket.on('notification', (data: any) => {
      playNotificationSound();

      let title = 'Notification';
      let body = '';
      let link = '/inbox';

      if (data.type === 'new_message') {
        title = `New message from ${data.senderWorkspaceDomain}`;
        body = data.messageText.length > 45 ? data.messageText.slice(0, 45) + '...' : data.messageText;
        link = `/inbox/${data.threadId}`;
      } else if (data.type === 'new_connection') {
        title = 'New Connection Request';
        body = `${data.senderWorkspaceName} (${data.senderWorkspaceDomain}) sent you a backlink exchange request.`;
        link = '/inbox';
      } else if (data.type === 'new_thread') {
        title = data.title || 'New Connection Match!';
        body = data.body || 'You have a new connection in your inbox.';
        link = '/inbox';
      } else if (data.type === 'connection_accepted') {
        title = 'Request Accepted ✅';
        body = `${data.receiverWorkspaceName} accepted your backlink request!`;
        link = `/inbox/${data.threadId}`;
      } else if (data.type === 'connection_rejected') {
        title = 'Request Rejected';
        body = `${data.receiverWorkspaceName} declined your backlink exchange request.`;
        link = `/inbox/${data.threadId}`;
      } else if (data.type === 'link_placed') {
        title = 'Link Placed! 🎉';
        body = data.body || `The giver has added the backlink details. Check your Dashboard!`;
        link = `/dashboard`;
      } else if (data.type === 'admin_broadcast') {
        title = data.title || 'System Announcement';
        body = data.body || '';
        link = '/inbox';
      }

      setNotifications(prev => [
        {
          id: data.messageId || Math.random().toString(),
          type: data.type,
          title,
          body,
          timestamp: new Date(),
          read: false,
          link
        },
        ...prev
      ]);
      
      // Tell inbox or other pages to refresh automatically
      if (['new_thread', 'new_connection', 'connection_accepted', 'connection_rejected', 'link_placed'].includes(data.type)) {
        window.dispatchEvent(new Event('refresh_inbox'));
      }
    });

    return () => {
      socket.emit('leaveWorkspace', workspace.id);
      socket.disconnect();
    };
  }, [workspace, loading]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setShowDropdown(false);
    router.push(notif.link);
  };

  const isLinkActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const urlParams = new URLSearchParams(query);
      const currentParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      return urlParams.get('filter') === currentParams.get('filter');
    }
    if (href === '/inbox') {
      if (pathname !== '/inbox') return false;
      const currentParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const filter = currentParams.get('filter');
      return !filter || filter === 'all';
    }
    return pathname.startsWith(href);
  };

  const changeTheme = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('bl_theme', t);
  };

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      light: 'color',
      color: 'dark',
      dark: 'light',
    };
    changeTheme(nextTheme[theme]);
  };

  if (loading || !user || !workspace) return null;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px 20px' }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>SERPsupport</div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px' }}>WEBSITE PORTAL</div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', opacity: 0.6 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {/* Nav links */}
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isLinkActive(href);
          return (
            <Link key={href} href={href}
              className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />


        {/* Sign Out Button */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <button 
            onClick={logout} 
            className="nav-item" 
            style={{ 
              color: 'var(--red)', 
              background: 'none', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '6px',
              width: '100%',
              margin: '8px 0 0 0',
              padding: '8px 16px',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              fontWeight: 600,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
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
            <span className="logo-text">SERPsupport</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn-ghost btn-icon"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isLinkActive(href);
          return (
            <Link key={href} href={href}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 8, paddingBottom: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
            {user.email}
          </div>
        </div>

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
          borderBottom: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface)', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 32px', 
          flexShrink: 0,
          zIndex: 100 
        }}>
          {/* Breadcrumb — with hamburger on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              id="mobile-sidebar-toggle"
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(v => !v)}
              style={{ padding: 6, height: 34, width: 34 }}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{workspace?.websiteName || user.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {pathname?.split('/')[1] ? pathname.split('/')[1].charAt(0).toUpperCase() + pathname.split('/')[1].slice(1) : 'Overview'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon size={18} /> : theme === 'color' ? <Palette size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell Icon */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                title="Notifications"
              >
                <Bell size={18} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ 
                    position: 'absolute', top: 0, right: 0, 
                    background: 'var(--red)', color: 'white', 
                    borderRadius: '999px', fontSize: '0.6rem', 
                    fontWeight: 'bold', width: '15px', height: '15px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  marginTop: '12px',
                  width: 320, 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius)', 
                  boxShadow: 'var(--shadow-lg)', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  zIndex: 1000 
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button 
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid var(--border-subtle)', 
                            cursor: 'pointer',
                            background: n.read ? 'transparent' : 'var(--accent-glow)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-glow)'}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{n.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
