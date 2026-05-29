'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ExternalLink, RefreshCw, Loader2, MessageSquare, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

type LinkRow = {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: string;
  status: string;
  datePlaced: string;
  giverWorkspace: { id: string; domain: string };
  receiverWorkspace: { id: string; domain: string };
  thread?: { id: string; stage: string };
};

const STATUS_OPTIONS = ['LIVE', 'REMOVED', 'DEPARTED'];

const TYPE_LABELS: Record<string, string> = {
  GUEST_POST: 'Guest Post',
  NICHE_EDIT: 'Niche Edit',
  IMAGE: 'Image',
  OTHER: 'Other',
};

export default function LinksPage() {
  const { workspace } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'GIVEN' | 'RECEIVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'REMOVED' | 'DEPARTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Listen to search events from AppShell sidebar input
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchQuery((e as CustomEvent).detail || '');
    };
    window.addEventListener('bl_search', handleSearch);
    return () => window.removeEventListener('bl_search', handleSearch);
  }, []);

  const filteredLinks = links.filter(link => {
    const isGiver = link.giverWorkspace.id === workspace?.id;
    if (directionFilter === 'GIVEN' && !isGiver) return false;
    if (directionFilter === 'RECEIVED' && isGiver) return false;
    if (statusFilter !== 'ALL' && link.status !== statusFilter) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        link.sourceUrl.toLowerCase().includes(q) ||
        link.targetUrl.toLowerCase().includes(q) ||
        link.anchorText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/links');
      setLinks(res.data.links);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (linkId: string, status: string) => {
    setUpdating(linkId);
    try {
      const res = await api.patch(`/api/links/${linkId}/status`, { status });
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: res.data.link.status } : l));
    } catch {} finally { setUpdating(null); }
  };

  const truncate = (url: string, max = 36) => {
    try {
      const u = new URL(url);
      const path = u.hostname + u.pathname;
      return path.length > max ? path.substring(0, max) + '…' : path;
    } catch { return url.substring(0, max); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 32px 16px 32px' }}>
        <div>
          <h1 style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '2.5rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '12px 0 0 0' }}>
            An overview of every backlink placed across your site and partner sites.
          </p>
        </div>
        <button onClick={load} className="btn" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'all 0.15s'
        }} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ padding: '20px 32px 24px 32px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>TYPE</span>
          {['ALL', 'RECEIVED', 'GIVEN'].map(type => {
            const label = type === 'ALL' ? 'All' : type === 'RECEIVED' ? 'Backlinks In' : 'Backlinks Out';
            const isActive = directionFilter === type;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setDirectionFilter(type as any)} style={{
                  background: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                  {label}
                </button>
                {type !== 'ALL' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'help' }}>ⓘ</span>}
              </div>
            );
          })}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>STATUS</span>
          {['ALL', 'LIVE', 'REMOVED', 'DEPARTED'].map(status => {
            let label = 'All';
            if (status === 'LIVE') label = '🟢 Live';
            if (status === 'REMOVED') label = '🔴 Removed';
            if (status === 'DEPARTED') label = '⚫ Departed';
            const isActive = statusFilter === status;
            return (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setStatusFilter(status as any)} style={{
                  background: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                  {label}
                </button>
                {status !== 'ALL' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'help' }}>ⓘ</span>}
              </div>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 40px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : links.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}><ExternalLink /></div>
            <h3>No placed links yet</h3>
            <p>Once you complete an exchange thread and submit link details, they will appear here.</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}><ExternalLink /></div>
            <h3>No matching links</h3>
            <p>Adjust your filters or search above to view other records.</p>
          </div>
        ) : (
          <div style={{ minWidth: 900, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            {/* Header row */}
            <div className="links-grid" style={{ background: 'var(--bg-surface)' }}>
              {['FROM URL', 'TO URL', 'ANCHOR TEXT', 'DATE PLACED', 'CHAT', 'STATUS'].map(h => (
                <div key={h} className="links-grid-header" style={{ borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>

            {/* Data rows */}
            {filteredLinks.map(link => {
              const isGiver = link.giverWorkspace.id === workspace?.id;
              return (
                <div key={link.id} id={`link-row-${link.id}`} className="links-grid"
                  style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>

                  {/* From URL */}
                  <div className="links-grid-cell">
                    <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 500 }}
                      onClick={e => e.stopPropagation()}>
                      {truncate(link.sourceUrl)}
                      <ArrowUpRight size={12} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  </div>

                  {/* To URL */}
                  <div className="links-grid-cell">
                    <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 500 }}
                      onClick={e => e.stopPropagation()}>
                      {truncate(link.targetUrl)}
                      <ArrowUpRight size={12} style={{ color: 'var(--text-muted)' }} />
                    </a>
                  </div>

                  {/* Anchor Text */}
                  <div className="links-grid-cell" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    &quot;{link.anchorText}&quot;
                  </div>

                  {/* Date Placed */}
                  <div className="links-grid-cell" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(link.datePlaced).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Chat Link */}
                  <div className="links-grid-cell">
                    {link.thread ? (
                      <Link href={`/inbox/${link.thread.id}`}
                        style={{ color: 'var(--text-secondary)', display: 'inline-flex', flexDirection: 'column', textDecoration: 'none', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        <span>Partner</span>
                        <span>Chat</span>
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </div>

                  {/* Status dropdown */}
                  <div className="links-grid-cell" style={{ overflow: 'visible' }}>
                    {updating === link.id ? (
                      <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    ) : (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select
                          id={`status-${link.id}`}
                          value={link.status}
                          onChange={e => handleStatusChange(link.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            appearance: 'none',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '4px 24px 4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}>
                          <option value="LIVE">🟢 Live</option>
                          <option value="REMOVED">🔴 Removed</option>
                          <option value="DEPARTED">⚫ Departed</option>
                        </select>
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: 'var(--text-muted)' }}>⌄</span>
                      </div>
                    )}
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
