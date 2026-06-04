'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
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

const StatusDropdown = ({ linkId, currentStatus, onStatusChange }: { linkId: string; currentStatus: string; onStatusChange: (id: string, status: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusStyles = (status: string) => {
    if (status === 'LIVE') return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981', label: 'Live' };
    if (status === 'REMOVED') return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e', label: 'Removed' };
    if (status === 'DEPARTED') return { bg: '#f5f5f4', text: '#78716c', border: '#e7e5e4', dot: '#a8a29e', label: 'Departed' };
    return { bg: '#f5f5f4', text: '#78716c', border: '#e7e5e4', dot: '#a8a29e', label: 'Unknown' };
  };

  const sStyles = getStatusStyles(currentStatus);
  const options = ['LIVE', 'REMOVED', 'DEPARTED'];

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: sStyles.bg, border: `1px solid ${sStyles.border}`,
          borderRadius: '6px', padding: '4px 8px', fontSize: '10.5px', fontWeight: 500, color: sStyles.text, 
          transition: 'filter 0.15s ease', cursor: 'pointer', outline: 'none'
        }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sStyles.dot, display: 'inline-block', flexShrink: 0 }} />
        <span>{sStyles.label}</span>
        <svg style={{ marginLeft: 2 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', zIndex: 50, marginTop: 4, left: 0, width: 140,
          backgroundColor: '#FFFFFF', border: '1px solid rgba(231, 229, 228, 0.8)',
          borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          padding: '4px 0', display: 'flex', flexDirection: 'column'
        }}>
          {options.map(opt => {
            const optStyle = getStatusStyles(opt);
            const isSelected = opt === currentStatus;
            return (
              <button
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(linkId, opt);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, textAlign: 'left', backgroundColor: isSelected ? '#F5F5F4' : 'transparent',
                  fontWeight: isSelected ? 600 : 400, color: '#44403C', border: 'none', cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F5F5F4'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: optStyle.dot, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{optStyle.label}</span>
                {isSelected && (
                  <svg style={{ color: '#A8A29E', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.825rem', fontWeight: 500, display: 'inline-flex' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Show Chat
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
                        <StatusDropdown linkId={link.id} currentStatus={link.status} onStatusChange={handleStatusChange} />
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
