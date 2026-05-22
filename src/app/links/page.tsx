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

  const filteredLinks = links.filter(link => {
    const isGiver = link.giverWorkspace.id === workspace?.id;
    if (directionFilter === 'GIVEN' && !isGiver) return false;
    if (directionFilter === 'RECEIVED' && isGiver) return false;
    if (statusFilter !== 'ALL' && link.status !== statusFilter) return false;
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Placed Links</h1>
          <p className="page-sub">
            {filteredLinks.length === links.length
              ? `${links.length} link record${links.length !== 1 ? 's' : ''}`
              : `${filteredLinks.length} of ${links.length} filtered`
            }
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ padding:'12px 24px', display:'flex', gap:16, borderBottom:'1px solid var(--border)', flexWrap:'wrap', alignItems:'center', background:'var(--bg-surface)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)' }}>Direction:</span>
          <select value={directionFilter} onChange={e => setDirectionFilter(e.target.value as any)} className="input-field" style={{ width:220, padding:'4px 8px', fontSize:'0.8125rem', height:32, cursor:'pointer' }}>
            <option value="ALL">All Directions</option>
            <option value="GIVEN">Backlinks Out (Given)</option>
            <option value="RECEIVED">Backlinks In (Received)</option>
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)' }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="input-field" style={{ width:150, padding:'4px 8px', fontSize:'0.8125rem', height:32, cursor:'pointer' }}>
            <option value="ALL">All Statuses</option>
            <option value="LIVE">Live</option>
            <option value="REMOVED">Removed</option>
            <option value="DEPARTED">Departed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }} />
            <p>Loading links…</p>
          </div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ExternalLink /></div>
            <h3>No placed links yet</h3>
            <p>Once you complete an exchange thread and submit link details, they will appear here.</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ExternalLink /></div>
            <h3>No matching links</h3>
            <p>Adjust your direction or status filters above to view other records.</p>
          </div>
        ) : (
          <div style={{ minWidth:900 }}>
            {/* Header row */}
            <div className="links-grid" style={{ position:'sticky', top:0, zIndex:10 }}>
              {['From URL','To URL','Anchor Text','Date Placed','Chat','Status'].map(h => (
                <div key={h} className="links-grid-header">{h}</div>
              ))}
            </div>

            {/* Data rows */}
            {filteredLinks.map(link => {
              const isGiver = link.giverWorkspace.id === workspace?.id;
              return (
                <div key={link.id} id={`link-row-${link.id}`} className="links-grid"
                  style={{ background: 'var(--bg-card)', transition:'background 0.15s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>

                  {/* From URL */}
                  <div className="links-grid-cell">
                    <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color:'var(--accent)', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}
                      onClick={e => e.stopPropagation()}>
                      <ArrowUpRight size={12} />
                      {truncate(link.sourceUrl)}
                    </a>
                    <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>
                      {isGiver ? '📤 You gave' : '📥 You received'} · {TYPE_LABELS[link.linkType] || link.linkType}
                    </p>
                  </div>

                  {/* To URL */}
                  <div className="links-grid-cell">
                    <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color:'var(--text-primary)', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={12} style={{ color:'var(--text-muted)' }} />
                      {truncate(link.targetUrl)}
                    </a>
                  </div>

                  {/* Anchor Text */}
                  <div className="links-grid-cell" style={{ color:'var(--text-secondary)', fontStyle:'italic' }}>
                    &quot;{link.anchorText}&quot;
                  </div>

                  {/* Date Placed */}
                  <div className="links-grid-cell" style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>
                    {new Date(link.datePlaced).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}
                  </div>

                  {/* Chat Link */}
                  <div className="links-grid-cell">
                    {link.thread ? (
                      <Link href={`/inbox/${link.thread.id}`}
                        style={{ color:'var(--accent)', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                        <MessageSquare size={14} />
                      </Link>
                    ) : (
                      <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
                    )}
                  </div>

                  {/* Status dropdown */}
                  <div className="links-grid-cell">
                    {updating === link.id ? (
                      <Loader2 size={14} className="animate-spin" style={{ color:'var(--accent)' }} />
                    ) : (
                      <select
                        id={`status-${link.id}`}
                        value={link.status}
                        className={`status-select ${link.status}`}
                        onChange={e => handleStatusChange(link.id, e.target.value)}
                        onClick={e => e.stopPropagation()}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
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
