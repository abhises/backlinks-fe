'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Link2, Inbox, ExternalLink, LayoutDashboard, Settings,
  LogOut, Sun, Moon, Palette, ChevronDown, Globe, Bell
} from 'lucide-react';
import { io } from 'socket.io-client';

type NotificationItem = {
  id: string;
  type: 'new_message' | 'new_connection' | 'connection_accepted';
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
  { href: '/links', icon: ExternalLink, label: 'Placed Links' },
  { href: '/discover', icon: LayoutDashboard, label: 'Discover' },
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
  const isThreadPage = pathname ? (pathname.startsWith('/inbox/') && pathname !== '/inbox') : false;
  const topPosition = isThreadPage ? 16 : 30;
  const rightPosition = isThreadPage ? 24 : 32;

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
      } else if (data.type === 'connection_accepted') {
        title = 'Request Accepted';
        body = `${data.receiverWorkspaceName} accepted your backlink request!`;
        link = `/inbox/${data.threadId}`;
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

        {/* Workspace pill */}
        <div style={{ margin: '0 8px', padding: '12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Globe size={13} color="var(--accent)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{workspace.domain}</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{workspace.websiteName}</p>
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={logout} className="nav-item" style={{ width: '100%', color: 'var(--red)' }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ position: 'relative' }}>
        {/* Floating Controls in Top Right: Notification Bell + Theme Toggle */}
        <div style={{ position: 'absolute', top: topPosition, right: rightPosition, zIndex: 100, display: 'flex', gap: 8, alignItems: 'center' }}>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="btn btn-secondary btn-icon"
              title="Notifications"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, padding: 0, borderRadius: 'var(--radius-sm)', position: 'relative' }}
            >
              <Bell size={16} />
              {notifications.some(n => !n.read) && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%' }} />
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
        {children}
      </main>
    </div>
  );
}
