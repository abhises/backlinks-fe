'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Inbox, LayoutDashboard, Settings, LogOut, Sun, Moon, Palette,
  Bell, Menu, X, ArrowDownLeft, ArrowUpRight, Sparkles, MessageCircle, Check, User
} from 'lucide-react';
import { io } from 'socket.io-client';
import GlobalSearch from './GlobalSearch';

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

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const NAV = [
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/how-it-works', icon: Sparkles, label: 'How it works' },
];

const THEMES = ['dark', 'light'] as const;
type Theme = typeof THEMES[number];

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { user, workspace, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState<Theme>('dark');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeToast, setActiveToast] = useState<{ id: string, title: string, body: string } | null>(null);

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

    api.get('/api/notifications').then(res => {
      const persisted = res.data.notifications.map((n: any) => {
        let title = 'Notification';
        let body = '';
        let link = '/inbox';
        try {
          const data = JSON.parse(n.payload);
          if (data.type === 'new_message') {
            title = `New message from ${data.senderWorkspaceDomain}`;
            body = data.messageText.length > 45 ? data.messageText.slice(0, 45) + '...' : data.messageText;
            link = `/inbox/${data.threadId}`;
          } else if (data.type === 'new_connection') {
            title = 'New BACKLINK IN Received 📥';
            body = `${data.senderWorkspaceName} (${data.senderWorkspaceDomain}) sent you a backlink in request.`;
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
        } catch(e) {}
        return {
          id: n.id,
          type: n.type,
          title,
          body,
          timestamp: new Date(n.createdAt),
          read: n.read,
          link
        };
      });
      setNotifications(persisted);
    }).catch(console.error);

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
        title = 'New BACKLINK IN Received 📥';
        body = `${data.senderWorkspaceName} (${data.senderWorkspaceDomain}) sent you a backlink in request.`;
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

      // Show toast
      const toastId = Math.random().toString();
      setActiveToast({ id: toastId, title, body });
      setTimeout(() => {
        setActiveToast(prev => prev?.id === toastId ? null : prev);
      }, 5000);
    });

    return () => {
      socket.emit('leaveWorkspace', workspace.id);
      socket.disconnect();
    };
  }, [workspace, loading]);

  const markAllRead = () => {
    api.post('/api/notifications/mark-read').catch(console.error);
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
      return urlParams.get('filter') === searchParams.get('filter');
    }
    if (href === '/inbox') {
      if (pathname !== '/inbox') return false;
      const filter = searchParams.get('filter');
      return !filter || filter === 'all';
    }
    if (href === '/how-it-works') {
      return pathname === '/how-it-works';
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
      light: 'dark',
      dark: 'light',
    };
    changeTheme(nextTheme[theme]);
  };

  if (loading || !user || !workspace) return null;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo and Bell */}
        <div style={{ padding: '12px 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0' }}>SERPSupport</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px' }}>WEBSITE PORTAL</div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-secondary)',
              }}
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ 
                  position: 'absolute', top: '-2px', right: '-2px', 
                  background: 'var(--red)', color: 'white', 
                  borderRadius: '999px', fontSize: '0.6rem', 
                  fontWeight: 'bold', width: '15px', height: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <GlobalSearch />



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



        {/* Profile / Settings Card */}
        <div 
          style={{ margin: '0 8px 8px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }} 
          onClick={() => router.push('/settings')} 
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} 
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{ width: 36, height: 36, background: '#E0E7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#312E81', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
              {(workspace?.domain || user.name).substring(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workspace?.domain || user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Settings size={12} /> Settings · {user.name.split(' ')[0]}
              </div>
            </div>
          </div>
          <ArrowUpRight size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: 8 }} />
        </div>

        {/* Sign Out Button */}
        <div style={{ padding: '0 8px 20px 8px' }}>
          <button 
            onClick={logout} 
            className="nav-item" 
            style={{ 
              color: 'var(--red)', 
              background: 'none', 
              border: '2px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '6px',
              width: '100%',
              margin: '0',
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

        <div style={{ padding: '0 8px 16px 8px' }}>
          <button
            onClick={() => { setSidebarOpen(false); logout(); }}
            className="nav-item"
            style={{
              color: 'var(--red)', background: 'none',
              border: '2px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px',
              fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit',
              textAlign: 'left', cursor: 'pointer', margin: 0, width: '100%',
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
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', width: '100%', background: 'var(--bg-base)' }}>
        {/* Mobile Header (Hidden on Desktop via CSS) */}
        <header className="mobile-only-header" style={{ 
          height: '60px', 
          borderBottom: '1px solid var(--border-subtle)', 
          background: 'var(--bg-surface)', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 20px', 
          flexShrink: 0,
          zIndex: 100 
        }}>
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
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>

        {/* Notifications Slide-out Drawer */}
        {showDropdown && (
          <>
            {/* Backdrop overlay */}
            <div 
              onClick={() => setShowDropdown(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 2000, backdropFilter: 'blur(2px)' }} 
            />
            {/* Drawer */}
            <div style={{
              position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', maxWidth: '100vw',
              background: 'var(--bg-surface)', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              zIndex: 2001, display: 'flex', flexDirection: 'column',
              transform: 'translateX(0)', transition: 'transform 0.3s ease'
            }}>
              {/* Header */}
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: '"Lora", "Georgia", serif', color: 'var(--text-primary)', margin: 0 }}>Notifications</h2>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span style={{ background: 'var(--red)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {notifications.some(n => !n.read) && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>Mark all read</button>
                  )}
                  <button onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => {
                    let IconComp = Bell;
                    let iconBg = 'var(--bg-hover)';
                    let iconColor = 'var(--text-secondary)';
                    
                    if (n.type === 'new_message') { IconComp = MessageCircle; iconBg = 'rgba(59, 130, 246, 0.1)'; iconColor = '#3b82f6'; }
                    else if (n.type === 'connection_accepted' || n.type === 'link_placed') { IconComp = Check; iconBg = 'rgba(16, 185, 129, 0.1)'; iconColor = '#10b981'; }
                    else if (n.type === 'new_connection') { IconComp = Sparkles; iconBg = 'rgba(168, 85, 247, 0.1)'; iconColor = '#a855f7'; }
                    else if (n.type === 'connection_rejected') { IconComp = X; iconBg = 'rgba(239, 68, 68, 0.1)'; iconColor = '#ef4444'; }
                    else if (n.type === 'admin_broadcast') { IconComp = User; iconBg = 'var(--bg-hover)'; iconColor = 'var(--text-primary)'; }

                    return (
                      <div key={n.id} 
                        onClick={() => handleNotifClick(n)}
                        style={{ 
                          padding: '20px 32px', 
                          borderBottom: '1px solid var(--border)', 
                          display: 'flex', 
                          gap: '16px',
                          borderLeft: n.read ? '4px solid transparent' : '4px solid #10b981',
                          background: n.read ? 'transparent' : 'var(--bg-base)',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--bg-base)'}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconComp size={20} />
                        </div>
                        <div style={{ paddingTop: '2px' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.4 }}>{n.body}</div>}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTimeAgo(n.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Global Toast Notification */}
        {activeToast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 9999,
            width: '320px',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeToast.title}</div>
              <button onClick={() => setActiveToast(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{activeToast.body}</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }} />}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
