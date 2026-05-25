'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Link2, Inbox, ExternalLink, LayoutDashboard, Settings,
  LogOut, Sun, Moon, Palette, ChevronDown, Globe, Bell, Menu, X, Shield
} from 'lucide-react';
import { io } from 'socket.io-client';

type NotificationItem = {
  id: string;
  type: 'new_message' | 'new_connection' | 'connection_accepted' | 'connection_rejected';
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
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/discover', icon: Globe, label: 'Discover' },
  { href: '/settings', icon: Settings, label: 'Settings' },
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
      if (['new_thread', 'new_connection', 'connection_accepted', 'connection_rejected'].includes(data.type)) {
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
          <span className="logo-text">SERPsupport</span>
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
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 8, paddingBottom: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
            {user.email}
          </div>
        </div>
          
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
            <div className="logo-icon"><Link2 size={17} color="#fff" /></div>
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

        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={18} />
            {label}
          </Link>
        ))}

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
          borderBottom: '1px solid var(--border)', 
          background: 'var(--bg-surface)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 24px', 
          flexShrink: 0,
          zIndex: 100 
        }}>
          {/* Breadcrumb — with hamburger on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Hamburger: visible only on mobile via CSS */}
            <button
              id="mobile-sidebar-toggle"
              className="btn btn-ghost btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(v => !v)}
              style={{ padding: 6, height: 34, width: 34 }}
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{user.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {pathname?.split('/')[1] ? pathname.split('/')[1].charAt(0).toUpperCase() + pathname.split('/')[1].slice(1) : 'Overview'}
            </span>
          </div>

          {/* Top Right Controls: Notification Bell + Theme Toggle */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn btn-secondary btn-icon"
                title="Notifications"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, padding: 0, borderRadius: 'var(--radius-sm)', position: 'relative' }}
              >
                <Bell size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ 
                    position: 'absolute', top: -4, right: -4, 
                    background: 'var(--red)', color: 'white', 
                    borderRadius: '999px', fontSize: '0.65rem', 
                    fontWeight: 'bold', padding: '2px 6px',
                    border: '2px solid var(--bg-surface)' 
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showDropdown && (
                <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 320, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 110 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : 'var(--bg-hover)', transition: 'background 0.2s' }}
                        >
                          <p style={{ fontWeight: n.read ? 600 : 700, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 4 }}>{n.body}</p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
