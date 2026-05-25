'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Inbox, Plus, Check, X, MessageSquare, ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
type Thread = {
  id: string;
  stage: string;
  status: string;
  giverWorkspace: { id: string; domain: string; websiteName: string };
  receiverWorkspace: { id: string; domain: string; websiteName: string };
  messages: { messageText: string; timestamp: string }[];
  updatedAt: string;
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'in',  label: 'Backlinks In' },
  { key: 'out', label: 'Backlinks Out' },
];

export default function InboxPage() {
  const { workspace } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectCount, setRejectCount] = useState(3);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/threads?filter=${filter}`);
      setThreads(res.data.threads);
    } catch {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

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
      setThreads(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/threads/${id}/status`, { status: 'ACCEPTED' });
      router.push(`/inbox/${id}`);
    } catch {} finally { setActionLoading(null); }
  };

  const isIncoming = (t: Thread) => t.receiverWorkspace.id === workspace?.id;
  const isNew = (t: Thread) => t.stage === 'NEW' && t.status === 'PENDING';

  const getInitials = (domain: string) => domain.substring(0, 2).toUpperCase();

  const getOtherSite = (t: Thread) =>
    isIncoming(t) ? t.giverWorkspace : t.receiverWorkspace;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Inbox</h1>
          <p className="page-sub">{threads.length} connection{threads.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} className="btn btn-secondary btn-sm btn-icon" title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding:'16px 24px', display:'flex', gap:8, borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} id={`filter-${f.key}`}
            className={`chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? (
          <div className="empty-state">
            <Loader2 size={32} className="animate-spin" style={{ color:'var(--accent)' }} />
            <p>Loading threads…</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Inbox /></div>
            <h3>No connections yet</h3>
            <p>Waiting for the system to generate your matches. Check back later!</p>
          </div>
        ) : (
          threads.map(t => {
            const other = getOtherSite(t);
            const incoming = isIncoming(t);
            const pending = isNew(t);
            const isRejecting = rejectId === t.id;

            return (
              <div key={t.id}
                id={`thread-${t.id}`}
                className="thread-tile"
                onClick={() => !pending && router.push(`/inbox/${t.id}`)}>

                {/* Avatar */}
                <div className="domain-avatar">{getInitials(other.domain)}</div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontWeight:700, fontSize:'0.9375rem' }}>{other.websiteName}</span>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{other.domain}</span>
                    <span className={`pill pill-${t.stage.toLowerCase()}`} style={{ marginLeft:'auto' }}>
                      {t.stage}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.8125rem', color:'var(--text-secondary)' }}>
                    {incoming
                      ? <><ArrowDownLeft size={13} color="var(--green)" /> Incoming from {t.giverWorkspace.domain}</>
                      : <><ArrowUpRight size={13} color="var(--accent)" /> Outgoing to {t.receiverWorkspace.domain}</>
                    }
                    {t.messages[0] && (
                      <span style={{ color:'var(--text-muted)', marginLeft:8 }}>
                        · {t.messages[0].messageText.slice(0, 40)}{t.messages[0].messageText.length > 40 ? '…' : ''}
                      </span>
                    )}
                  </div>

                  {/* Reject countdown bar */}
                  {isRejecting && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--red)', marginBottom:4 }}>
                        <span>Rejecting in {rejectCount}s…</span>
                        <button onClick={e => { e.stopPropagation(); setRejectId(null); }}
                          style={{ color:'var(--text-secondary)', background:'none', border:'none', cursor:'pointer', fontSize:'0.75rem' }}>
                          Cancel
                        </button>
                      </div>
                      <div className="countdown-bar"><div className="countdown-fill" /></div>
                    </div>
                  )}
                </div>

                {/* Action buttons for NEW pending threads */}
                {pending && incoming && !isRejecting && (
                  <div style={{ display:'flex', gap:8 }} onClick={e => e.stopPropagation()}>
                    <button id={`reject-${t.id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => setRejectId(t.id)}
                      disabled={actionLoading === t.id}>
                      <X size={14} /> Reject
                    </button>
                    <button id={`approve-${t.id}`}
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(t.id)}
                      disabled={actionLoading === t.id}>
                      {actionLoading === t.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </button>
                  </div>
                )}

                {/* Chat icon for active threads */}
                {!pending && (
                  <MessageSquare size={18} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
