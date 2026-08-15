'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Inbox, LayoutDashboard, Settings, LogOut, Sun, Moon, Palette,
  Bell, Menu, X, ArrowDownLeft, ArrowUpRight, Sparkles, MessageCircle, Check, User, Link2,
  CreditCard
} from 'lucide-react';
import { io } from 'socket.io-client';
import GlobalSearch from './GlobalSearch';
import Cookies from 'js-cookie';
import { useLanguage } from '@/context/LanguageContext';

type NotificationItem = {
  id: string;
  type: string;
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

const formatTimeAgo = (date: Date, trans: (key: string) => string) => {
  const fill = (key: string, n: number) => trans(key).replace('{n}', String(n));
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return fill('time.yearsAgo', Math.floor(interval));
  interval = seconds / 2592000;
  if (interval > 1) return fill('time.monthsAgo', Math.floor(interval));
  interval = seconds / 86400;
  if (interval > 1) return fill('time.daysAgo', Math.floor(interval));
  interval = seconds / 3600;
  if (interval > 1) return fill('time.hoursAgo', Math.floor(interval));
  interval = seconds / 60;
  if (interval > 1) return fill('time.minutesAgo', Math.floor(interval));
  return fill('time.secondsAgo', Math.floor(seconds));
};

const NAV = [
  { href: '/inbox', icon: Inbox, label: 'Inbox', key: 'app.inbox' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', key: 'app.dashboard' },
  { href: '/billing', icon: CreditCard, label: 'Subscription', key: 'app.subscription' },
  { href: '/how-it-works', icon: Sparkles, label: 'How it works', key: 'app.howItWorks' },
];

const THEMES = ['dark', 'light'] as const;
type Theme = typeof THEMES[number];

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
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
  const [billingStatus, setBillingStatus] = useState<{ hasAccess: boolean; isTrialActive: boolean; trialDaysLeft: number; subscriptionStatus: string; isSubscribed: boolean; platformMode?: 'BETA' | 'PAID' } | null>(null);
  const isPro = !!billingStatus?.isSubscribed;
  const isBetaMode = billingStatus?.platformMode === 'BETA';
  const nav = NAV.filter(item => item.href !== '/billing' || !isBetaMode);
  const signupToastShownRef = useRef(false);

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

  // Shown once, right after a fresh signup's workspace setup completes and
  // lands here (the flag is set by AuthContext.register()). Guarded by a ref
  // (not just the sessionStorage removal) so React's dev-mode double effect
  // invocation can't fire the toast twice.
  useEffect(() => {
    if (!workspace?.id || signupToastShownRef.current) return;
    if (typeof window === 'undefined' || !sessionStorage.getItem('bl_just_signed_up')) return;
    signupToastShownRef.current = true;
    sessionStorage.removeItem('bl_just_signed_up');

    const toastId = Math.random().toString();
    setActiveToast({ id: toastId, title: t('auth.signupSuccessTitle'), body: t('auth.signupSuccessBody') });
    setTimeout(() => {
      setActiveToast(prev => prev?.id === toastId ? null : prev);
    }, 5000);
  }, [workspace?.id, t]);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') return;
    api.get('/api/billing/status').then(res => {
      setBillingStatus(res.data);
      if (!res.data.hasAccess && pathname !== '/settings') {
        router.replace('/settings#billing');
      }
    }).catch(() => {});
  }, [user, pathname, router]);

  useEffect(() => {
    if (!workspace?.id) return;

    api.get('/api/notifications').then(res => {
      const persisted = res.data.notifications.map((n: any) => {
        let title = n.title || t('notif.default');
        let body = n.body || '';
        let link = n.link || '/inbox';
        try {
          if (n.payload) {
            // Sometimes it's already an object if the backend parsed it, or JSON.parse is needed
            const data = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
            const notifType = data.type || n.type;

            if (notifType === 'new_message') {
              title = data.title || t('notif.newMessageFrom').replace('{name}', data.senderWorkspaceDomain || t('notif.unknownUser'));
              body = data.messageText ? (data.messageText.length > 45 ? data.messageText.slice(0, 45) + '...' : data.messageText) : (data.body || n.body);
              link = `/inbox/${data.threadId || ''}`;
            } else if (notifType === 'new_connection') {
              title = data.title || t('notif.newConnectionTitle');
              body = data.body || t('notif.newConnectionBody').replace('{name}', data.senderWorkspaceName || t('notif.someone'));
              link = '/inbox';
            } else if (notifType === 'new_thread') {
              title = data.title || n.title || t('notif.newThreadTitle');
              body = data.body || n.body || (data.otherDomain
                ? t(data.direction === 'give' ? 'notif.newThreadBodyGive' : 'notif.newThreadBodyReceive').replace('{domain}', data.otherDomain)
                : t('notif.newThreadBody'));
              link = '/inbox';
            } else if (notifType === 'connection_accepted') {
              title = data.title || t('notif.acceptedTitle');
              body = data.body || t('notif.acceptedBody').replace('{name}', data.receiverWorkspaceName || t('notif.they'));
              link = `/inbox/${data.threadId || ''}`;
            } else if (notifType === 'connection_rejected') {
              title = data.title || t('notif.rejectedTitle');
              body = data.body || t('notif.rejectedBody').replace('{name}', data.receiverWorkspaceName || t('notif.they'));
              link = `/inbox/${data.threadId || ''}`;
            } else if (notifType === 'link_placed') {
              title = data.title || t('notif.linkPlacedTitle');
              body = data.body || (data.giverDomain
                ? t('notif.linkPlacedBodyWithDomain').replace('{domain}', data.giverDomain)
                : t('notif.linkPlacedBody'));
              link = `/dashboard`;
            } else if (notifType === 'subscription_active') {
              title = data.title || t('notif.subscriptionActiveTitle');
              body = data.body || t('notif.subscriptionActiveBody');
              link = '/billing';
            } else if (notifType === 'subscription_canceled') {
              title = data.title || t('notif.subscriptionCanceledTitle');
              body = data.body || t('notif.subscriptionCanceledBody');
              link = '/billing';
            } else if (notifType === 'admin_broadcast') {
              title = data.title || n.title || t('notif.systemAnnouncementTitle');
              body = data.body || data.description || data.messageText || n.body || '';
              link = '/inbox';
            } else if (notifType === 'no_matches') {
              title = data.title || t('notif.noMatchesTitle');
              body = data.body || t('notif.noMatchesBody');
              link = '/dashboard';
            } else if (notifType === 'system') {
              title = data.title || n.title || t('notif.systemAlertTitle');
              body = data.body || n.body || '';
              link = '/dashboard';
            } else if (notifType === 'signup_welcome') {
              title = data.title || t('auth.signupSuccessTitle');
              body = data.body || t('auth.signupSuccessBody');
              link = '/inbox';
            } else {
              // Fallback for unknown types so the user at least sees what it is
              title = data.title || n.title || (notifType ? t('notif.alertType').replace('{type}', notifType) : t('notif.default'));
              body = data.body || data.messageText || data.description || n.body || (typeof data === 'object' ? JSON.stringify(data) : String(data));
            }
          }
        } catch(e: any) {
          body = n.body || `Raw: ${n.payload}`;
        }

        return {
          id: n.id,
          type: n.type || 'unknown',
          title,
          body,
          timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
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

      let title = data.title || t('notif.default');
      let body = data.body || '';
      let link = data.link || '/inbox';

      if (data.type === 'new_message') {
        title = data.title || t('notif.newMessageFrom').replace('{name}', data.senderWorkspaceDomain || t('notif.unknownUser'));
        body = data.messageText ? (data.messageText.length > 45 ? data.messageText.slice(0, 45) + '...' : data.messageText) : (data.body || '');
        link = `/inbox/${data.threadId || ''}`;
      } else if (data.type === 'new_connection') {
        title = data.title || t('notif.newConnectionTitle');
        body = data.body || t('notif.newConnectionBody').replace('{name}', data.senderWorkspaceName || t('notif.someone'));
        link = '/inbox';
      } else if (data.type === 'new_thread') {
        title = data.title || t('notif.newThreadTitle');
        body = data.body || (data.otherDomain
          ? t(data.direction === 'give' ? 'notif.newThreadBodyGive' : 'notif.newThreadBodyReceive').replace('{domain}', data.otherDomain)
          : t('notif.newThreadBody'));
        link = '/inbox';
      } else if (data.type === 'connection_accepted') {
        title = data.title || t('notif.acceptedTitle');
        body = data.body || t('notif.acceptedBody').replace('{name}', data.receiverWorkspaceName || t('notif.they'));
        link = `/inbox/${data.threadId || ''}`;
      } else if (data.type === 'connection_rejected') {
        title = data.title || t('notif.rejectedTitle');
        body = data.body || t('notif.rejectedBody').replace('{name}', data.receiverWorkspaceName || t('notif.they'));
        link = `/inbox/${data.threadId || ''}`;
      } else if (data.type === 'link_placed') {
        title = data.title || t('notif.linkPlacedTitle');
        body = data.body || (data.giverDomain
          ? t('notif.linkPlacedBodyWithDomain').replace('{domain}', data.giverDomain)
          : t('notif.linkPlacedBody'));
        link = `/dashboard`;
      } else if (data.type === 'subscription_active') {
        title = data.title || t('notif.subscriptionActiveTitle');
        body = data.body || t('notif.subscriptionActiveBody');
        link = '/billing';
      } else if (data.type === 'subscription_canceled') {
        title = data.title || t('notif.subscriptionCanceledTitle');
        body = data.body || t('notif.subscriptionCanceledBody');
        link = '/billing';
      } else if (data.type === 'admin_broadcast') {
        title = data.title || t('notif.systemAnnouncementTitle');
        body = data.body || data.description || data.messageText || '';
        link = '/inbox';
      } else if (data.type === 'no_matches') {
        title = data.title || t('notif.noMatchesTitle');
        body = data.body || t('notif.noMatchesBody');
        link = '/dashboard';
      } else if (data.type === 'system') {
        title = data.title || t('notif.systemAlertTitle');
        body = data.body || '';
        link = '/dashboard';
      } else if (data.type === 'signup_welcome') {
        title = data.title || t('auth.signupSuccessTitle');
        body = data.body || t('auth.signupSuccessBody');
        link = '/inbox';
      } else {
        title = data.title || (data.type ? t('notif.alertType').replace('{type}', data.type) : t('notif.default'));
        body = data.body || data.messageText || data.description || (typeof data === 'object' ? JSON.stringify(data) : String(data));
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

    const handleGlobalToast = (e: any) => {
      const { title, body } = e.detail;
      const toastId = Math.random().toString();
      setActiveToast({ id: toastId, title, body });
      setTimeout(() => {
        setActiveToast(prev => prev?.id === toastId ? null : prev);
      }, 5000);
    };
    window.addEventListener('bl_show_toast', handleGlobalToast);

    return () => {
      window.removeEventListener('bl_show_toast', handleGlobalToast);
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
    Cookies.set('bl_theme', t, { expires: 365, path: '/' });
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link2 size={26} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0' }}>SERPsupport</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px' }}>{t('app.portal')}</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown && notifications.some(n => !n.read)) {
                  markAllRead();
                }
              }}
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

        {/* Theme Toggle */}
        <div style={{ margin: '2px 8px 12px 8px', display: 'flex', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border)', padding: '4px' }}>
          <button onClick={() => changeTheme('light')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', background: theme === 'light' ? 'var(--bg-hover)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Sun size={14} /> {t('app.light')}
          </button>
          <button onClick={() => changeTheme('dark')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', background: theme === 'dark' ? 'var(--bg-hover)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Moon size={14} /> {t('app.dark')}
          </button>
        </div>

        {/* Nav links */}
        {nav.map(({ href, icon: Icon, label, key }) => {
          const active = isLinkActive(href);
          return (
            <Link key={href} href={href}
              className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={18} />
              {t(key || '') || label}
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
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {workspace?.domain || user.name}
                </span>
                {isBetaMode ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#a855f7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.03em', padding: '2px 5px', borderRadius: 999, flexShrink: 0 }}>
                    <Sparkles size={8} /> BETA
                  </span>
                ) : isPro ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--accent)', color: '#fff', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.03em', padding: '2px 5px', borderRadius: 999, flexShrink: 0 }}>
                    <Sparkles size={8} /> PRO
                  </span>
                ) : billingStatus?.isTrialActive && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--amber)', color: '#1a1a1a', fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.03em', padding: '2px 5px', borderRadius: 999, flexShrink: 0 }}>
                    TRIAL
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Settings size={12} /> {t('app.settings')} · {user.name.split(' ')[0]}
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
            {t('app.signOut')}
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
            <Link2 size={24} color="var(--accent)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>SERPsupport</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn-ghost btn-icon"
            style={{ padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Toggle */}
        <div style={{ margin: '2px 8px 12px 8px', display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px' }}>
          <button onClick={() => changeTheme('light')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', background: theme === 'light' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: theme === 'light' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Sun size={14} /> {t('app.light')}
          </button>
          <button onClick={() => changeTheme('dark')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: theme === 'dark' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
            <Moon size={14} /> {t('app.dark')}
          </button>
        </div>

        {nav.map(({ href, icon: Icon, label, key }) => {
          const active = isLinkActive(href);
          return (
            <Link key={href} href={href}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              {t(key || '') || label}
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
            {t('app.signOut')}
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
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown && notifications.some(n => !n.read)) {
                  markAllRead();
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {!isBetaMode && billingStatus?.isTrialActive && pathname !== '/settings' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)',
              padding: '8px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)'
            }}>
              <span>{t('billing.bannerTrial').replace('{n}', String(billingStatus.trialDaysLeft))}</span>
              <Link href="/settings#billing" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                {t('billing.bannerUpgrade')}
              </Link>
            </div>
          )}
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
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600, fontFamily: '"Lora", "Georgia", serif', color: 'var(--text-primary)', margin: 0 }}>{t('app.notifications')}</h2>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span style={{ background: 'var(--red)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {notifications.some(n => !n.read) && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>{t('notif.markAllRead')}</button>
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
                    {t('notif.noneYet')}
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
                    else if (n.type === 'subscription_active') { IconComp = CreditCard; iconBg = 'rgba(217, 119, 6, 0.1)'; iconColor = '#d97706'; }
                    else if (n.type === 'subscription_canceled') { IconComp = CreditCard; iconBg = 'rgba(239, 68, 68, 0.1)'; iconColor = '#ef4444'; }
                    else if (n.type === 'admin_broadcast') { IconComp = User; iconBg = 'var(--bg-hover)'; iconColor = 'var(--text-primary)'; }
                    else if (n.type === 'signup_welcome') { IconComp = Sparkles; iconBg = 'rgba(16, 185, 129, 0.1)'; iconColor = '#10b981'; }

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
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTimeAgo(n.timestamp, t)}</div>
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
