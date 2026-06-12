'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Inbox, Loader2, MessageSquare, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Thread = {
  id: string;
  stage: string;
  status: string;
  giverWorkspace: { id: string; domain: string; websiteName: string; description?: string; teamMembers?: { user: { name: string } }[] };
  receiverWorkspace: { id: string; domain: string; websiteName: string; description?: string; teamMembers?: { user: { name: string } }[] };
  messages: { messageText: string; timestamp: string }[];
  updatedAt: string;
  giverAccepted: boolean;
  receiverAccepted: boolean;
};

const getAvatarColor = (domain: string) => {
  const colors = [
    { bg: '#d0e1fd', text: '#1e40af' }, // Blue
    { bg: '#fed7aa', text: '#c2410c' }, // Orange
    { bg: '#d1fae5', text: '#065f46' }, // Green
    { bg: '#fce7f3', text: '#9d174d' }, // Pink
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#e9d5ff', text: '#6b21a8' }, // Purple
  ];
  let sum = 0;
  const cleanDomain = domain.toLowerCase().trim();
  for (let i = 0; i < cleanDomain.length; i++) sum += cleanDomain.charCodeAt(i);
  return colors[sum % colors.length];
};

const getOwnerName = (workspace: any) => {
  if (workspace?.teamMembers && workspace.teamMembers.length > 0) {
    const name = workspace.teamMembers[0].user.name;
    return name ? name.split(' ')[0] : 'User';
  }
  return 'User';
};


const formatRelativeTime = (dateString: string) => {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    
    const remHours = diffHour % 24;
    if (remHours > 0) {
      return `${diffDay}d ${remHours}h ago`;
    }
    return `${diffDay}d ago`;
  } catch {
    return '1d ago';
  }
};

function InboxPageContent() {
  const { workspace } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams?.get('filter') || 'all';

  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState(activeFilter);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectCount, setRejectCount] = useState(3);
  const [rejectLimit, setRejectLimit] = useState(5);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state filter with search params from sidebar clicks
  useEffect(() => {
    if (activeFilter) {
      setFilter(activeFilter);
    }
  }, [activeFilter]);

  // Listen to search events from AppShell sidebar input
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchQuery((e as CustomEvent).detail || '');
    };
    window.addEventListener('bl_search', handleSearch);
    return () => window.removeEventListener('bl_search', handleSearch);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, rejectedRes] = await Promise.all([
        api.get(`/api/threads?filter=all`),
        api.get(`/api/threads?filter=rejected`)
      ]);
      const allThreads = allRes.data.threads.filter((t: Thread) => t.stage !== 'PLACED');
      const rejectedThreads = rejectedRes.data.threads;
      setThreads([...allThreads, ...rejectedThreads]);
      if (allRes.data.rejectLimit !== undefined) {
        setRejectLimit(allRes.data.rejectLimit);
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();

    const handleRefresh = () => load();
    window.addEventListener('refresh_inbox', handleRefresh);
    return () => window.removeEventListener('refresh_inbox', handleRefresh);
  }, [load]);

  // Reject countdown logic
  useEffect(() => {
    if (!rejectId) return;
    setRejectCount(3);
    const interval = setInterval(() => {
      setRejectCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          executeReject(rejectId);
          setRejectId(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rejectId]);

  const executeReject = async (id: string) => {
    try {
      await api.patch(`/api/threads/${id}/status`, { status: 'REJECTED' });
      setThreads(prev => prev.map(t => t.id === id ? { ...t, status: 'REJECTED' } : t));
    } catch { }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/api/threads/${id}/status`, { status: 'ACCEPTED' });
      setThreads(prev => prev.map(t => t.id === id ? { ...t, ...res.data.thread } : t));
    } catch { } finally { setActionLoading(null); }
  };

  const isIncoming = (t: Thread) => t.receiverWorkspace.id === workspace?.id;
  const isNew = (t: Thread) => t.stage === 'NEW' && t.status === 'PENDING';

  const getInitials = (domain: string) => {
    const parts = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.');
    if (parts.length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return domain.substring(0, 2).toUpperCase();
  };

  const getOtherSite = (t: Thread) =>
    isIncoming(t) ? t.giverWorkspace : t.receiverWorkspace;

  // Filter threads based on search query and active tab filter
  const filteredThreads = threads.filter(t => {
    const incoming = t.receiverWorkspace.id === workspace?.id;
    const isPending = t.stage === 'NEW' && t.status === 'PENDING';
    const actionRequired = isPending && ((incoming && !t.receiverAccepted) || (!incoming && !t.giverAccepted));
    
    // 1. Tab Filter
    if (filter === 'new') {
      if (t.status === 'REJECTED') return false;
      if (!actionRequired) return false;
    } else if (filter === 'in') {
      if (t.status === 'REJECTED') return false;
      if (t.receiverWorkspace.id !== workspace?.id) return false;
      if (actionRequired) return false;
    } else if (filter === 'out') {
      if (t.status === 'REJECTED') return false;
      if (t.giverWorkspace.id !== workspace?.id) return false;
      if (actionRequired) return false;
    } else if (filter === 'rejected') {
      if (t.status !== 'REJECTED') return false;
    } else {
      // all
      if (t.status === 'REJECTED') return false;
    }

    // 2. Search Filter
    if (!searchQuery) return true;
    const other = getOtherSite(t);
    const q = searchQuery.toLowerCase();
    return (
      other.websiteName.toLowerCase().includes(q) ||
      other.domain.toLowerCase().includes(q) ||
      (other.description && other.description.toLowerCase().includes(q))
    );
  });

  // Calculate dynamic thread counts for chips (before searching to keep chips stable)
  const checkNeedsAction = (t: Thread) => {
    const incoming = t.receiverWorkspace.id === workspace?.id;
    const pending = t.stage === 'NEW' && t.status === 'PENDING';
    return pending && ((incoming && !t.receiverAccepted) || (!incoming && !t.giverAccepted));
  };
  const countRejected = threads.filter(t => t.status === 'REJECTED').length;
  const countAll = threads.length - countRejected;
  const countNew = threads.filter(t => checkNeedsAction(t) && t.status !== 'REJECTED').length;
  const countIn = threads.filter(t => t.receiverWorkspace.id === workspace?.id && !checkNeedsAction(t) && t.status !== 'REJECTED').length;
  const countOut = threads.filter(t => t.giverWorkspace.id === workspace?.id && !checkNeedsAction(t) && t.status !== 'REJECTED').length;

  const filterOptions = [
    { key: 'all', label: `All ${countAll}` },
    { key: 'new', label: `New ${countNew}` },
    { key: 'in', label: `Backlinks In ${countIn}` },
    { key: 'out', label: `Backlinks Out ${countOut}` },
    { key: 'rejected', label: `Rejected ${countRejected}/${rejectLimit}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px 8px 32px' }}>
        <h1 style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '2.25rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
          {filter === 'out' ? 'Backlinks Out' : filter === 'in' ? 'Backlinks In' : filter === 'rejected' ? 'Rejected Requests' : 'Inbox'}
        </h1>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{filteredThreads.length} threads</span>
      </div>

      {/* Filter Chips */}
      <div style={{ padding: '0 32px 12px 32px', display: 'flex', gap: 10 }}>
        {filterOptions.map(f => (
          <button key={f.key}
            onClick={() => setFilter(f.key)}
            className={`chip ${filter === f.key ? 'active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : threads.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}><Inbox /></div>
            <h3>No conversations yet</h3>
            <p>Once you are matched, your active connections will appear here.</p>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}><Inbox /></div>
            <h3>No matching conversations</h3>
            <p>Try adjusting your search query or filters above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredThreads.map(t => {
              const other = getOtherSite(t);
              const incoming = isIncoming(t);
              const pending = isNew(t);
              const isRejecting = rejectId === t.id;
              
              const needsAction = pending && ((incoming && !t.receiverAccepted) || (!incoming && !t.giverAccepted));
              const avatarStyle = getAvatarColor(other.domain);

              return (
                <div key={t.id}
                  id={`thread-${t.id}`}
                  className="thread-tile"
                  style={{
                    position: 'relative',
                    borderLeft: needsAction ? '4px solid #10b981' : '4px solid transparent',
                    padding: '8px 32px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-base)',
                    cursor: pending ? 'default' : 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}
                  onClick={() => !pending && router.push(`/inbox/${t.id}`)}>

                  {/* Avatar */}
                  <div className="domain-avatar" style={{
                    background: avatarStyle.bg,
                    color: avatarStyle.text,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    boxShadow: 'none',
                    borderRadius: '50%'
                  }}>
                    {getInitials(other.domain)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{other.domain}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>· {getOwnerName(other)}</span>
                      
                      {/* Backlink Direction Badges */}
                      {incoming ? (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: '#0284c7', 
                          background: '#e0f2fe', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <ArrowDownLeft size={11} /> Backlink In
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: '#7c3aed', 
                          background: '#f3e8ff', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <ArrowUpRight size={11} /> Backlink Out
                        </span>
                      )}

                      {/* NEW state badge */}
                      {needsAction && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: '#ffffff', 
                          background: '#10b981', 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}>
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Description/Last message */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      {other.description ? other.description : (
                        t.messages && t.messages.length > 0 
                          ? t.messages[0].messageText 
                          : 'No message history yet'
                      )}
                    </div>
                  </div>

                  {/* Right Side Actions and Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    
                    {/* Action buttons for pending NEW request */}
                    {pending && !isRejecting && (
                      <div onClick={e => e.stopPropagation()}>
                        {((incoming && !t.receiverAccepted) || (!incoming && !t.giverAccepted)) ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button id={`approve-${t.id}`}
                              className="btn"
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                              onClick={() => handleApprove(t.id)}
                              disabled={actionLoading === t.id}>
                              {actionLoading === t.id ? <Loader2 size={12} className="animate-spin" /> : '✓ Approve'}
                            </button>
                            <button id={`reject-${t.id}`}
                              className="btn"
                              style={{
                                border: '1px solid #ef4444',
                                background: '#ffffff',
                                color: '#ef4444',
                                borderRadius: '4px',
                                padding: '6px 16px',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                opacity: countRejected >= rejectLimit ? 0.5 : 1
                              }}
                              onClick={() => {
                                if (countRejected >= rejectLimit) {
                                  window.dispatchEvent(new CustomEvent('bl_show_toast', {
                                    detail: {
                                      title: 'Rejection Limit Reached',
                                      body: `You have reached the maximum limit of ${rejectLimit} rejected requests. Please approve some requests first.`
                                    }
                                  }));
                                } else {
                                  setRejectId(t.id);
                                }
                              }}
                              disabled={actionLoading === t.id}>
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: '4px' }}>
                            <Loader2 size={12} className="animate-spin" /> Waiting for them to accept
                          </span>
                        )}
                      </div>
                    )}

                    {/* Reject countdown bar */}
                    {isRejecting && (
                      <div onClick={e => e.stopPropagation()} style={{ width: 140 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--red)', marginBottom: 4 }}>
                          <span>Rejecting in {rejectCount}s…</span>
                          <button onClick={e => { e.stopPropagation(); setRejectId(null); }}
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Cancel
                          </button>
                        </div>
                        <div className="countdown-bar"><div className="countdown-fill" /></div>
                      </div>
                    )}

                    {/* Right side indicators for active threads */}
                    {!pending && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {t.status === 'REJECTED' ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red)' }}>Rejected</span>
                        ) : t.status === 'PENDING' ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--bg-hover)', borderRadius: '4px' }}>
                            <Loader2 size={12} className="animate-spin" /> Waiting for them to accept
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: t.stage === 'PLACED' ? '#10b981' : 'var(--text-secondary)' }}>
                            {t.stage === 'PLACED' ? 'Link Placed ✓' : t.stage === 'CHAT' ? '' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'right' }}>
                      {formatRelativeTime(t.updatedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    }>
      <InboxPageContent />
    </Suspense>
  );
}
