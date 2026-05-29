'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ExternalLink, Loader2, ArrowUpRight } from 'lucide-react';
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

export default function LinksPage() {
  const { workspace } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'GIVEN' | 'RECEIVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'REMOVED' | 'DEPARTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  const typeFilters = [
    { value: 'ALL', label: 'All' },
    { value: 'RECEIVED', label: 'Backlinks In' },
    { value: 'GIVEN', label: 'Backlinks Out' },
  ];

  const statusFilters = [
    { value: 'ALL', label: 'All', dot: null },
    { value: 'LIVE', label: 'Live', dot: '#22c55e' },
    { value: 'REMOVED', label: 'Removed', dot: '#ef4444' },
    { value: 'DEPARTED', label: 'Departed', dot: '#374151' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>

      {/* Page Header */}
      <div style={{ padding: '28px 32px 0 32px' }}>
        <h1 style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
          An overview of every backlink placed across your site and partner sites.
        </p>
      </div>

      {/* Filters Bar */}
      <div style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap'
      }}>
        {/* TYPE label */}
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginRight: 4 }}>TYPE</span>

        {typeFilters.map(({ value, label }) => {
          const isActive = directionFilter === value;
          return (
            <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                onClick={() => setDirectionFilter(value as any)}
                style={{
                  background: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {label}
              </button>
              {value !== 'ALL' && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'help', userSelect: 'none' }}>ⓘ</span>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 8px', display: 'inline-block' }} />

        {/* STATUS label */}
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginRight: 4 }}>STATUS</span>

        {statusFilters.map(({ value, label, dot }) => {
          const isActive = statusFilter === value;
          return (
            <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                onClick={() => setStatusFilter(value as any)}
                style={{
                  background: isActive ? '#1a1a1a' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                {dot && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: isActive ? '#ffffff' : dot,
                    display: 'inline-block', flexShrink: 0
                  }} />
                )}
                {label}
              </button>
              {value !== 'ALL' && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'help', userSelect: 'none' }}>ⓘ</span>
              )}
            </div>
          );
        })}

        {/* Link count — far right */}
        <div style={{ marginLeft: 'auto', fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {filteredLinks.length} link{filteredLinks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 40px 32px', paddingTop: 0 }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['FROM URL', 'TO URL', 'ANCHOR TEXT', 'DATE PLACED', 'CHAT', 'STATUS'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-base)',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => {
                const isGiver = link.giverWorkspace.id === workspace?.id;
                const statusDotColor = link.status === 'LIVE' ? '#22c55e' : link.status === 'REMOVED' ? '#ef4444' : '#374151';
                return (
                  <tr key={link.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* FROM URL */}
                    <td style={{ padding: '14px 16px' }}>
                      <a href={link.sourceUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.875rem' }}>
                        {truncate(link.sourceUrl)}
                        <ArrowUpRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </a>
                    </td>

                    {/* TO URL */}
                    <td style={{ padding: '14px 16px' }}>
                      <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: '0.875rem' }}>
                        {truncate(link.targetUrl)}
                        <ArrowUpRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </a>
                    </td>

                    {/* ANCHOR TEXT */}
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      &quot;{link.anchorText}&quot;
                    </td>

                    {/* DATE PLACED */}
                    <td style={{ padding: '14px 16px', fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(link.datePlaced).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* CHAT */}
                    <td style={{ padding: '14px 16px' }}>
                      {link.thread ? (
                        <Link href={`/inbox/${link.thread.id}`}
                          style={{ color: 'var(--text-secondary)', display: 'inline-flex', flexDirection: 'column', textDecoration: 'none', fontSize: '0.8rem', lineHeight: 1.4 }}>
                          <span>Partner</span>
                          <span>Chat</span>
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '14px 16px' }}>
                      {updating === link.id ? (
                        <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                      ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDotColor, display: 'inline-block', flexShrink: 0 }} />
                            <select
                              id={`status-${link.id}`}
                              value={link.status}
                              onChange={e => handleStatusChange(link.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                appearance: 'none',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                outline: 'none',
                                paddingRight: 14
                              }}>
                              <option value="LIVE">Live</option>
                              <option value="REMOVED">Removed</option>
                              <option value="DEPARTED">Departed</option>
                            </select>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', pointerEvents: 'none', marginLeft: -10 }}>⌄</span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
