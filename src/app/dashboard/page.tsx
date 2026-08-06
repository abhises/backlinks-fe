'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ExternalLink, Loader2, ArrowUpRight, CreditCard, FileText } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

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

type BillingStatus = {
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  isTrialActive: boolean;
  trialDaysLeft: number;
  hasAccess: boolean;
  isSubscribed: boolean;
  cancelAtPeriodEnd: boolean;
};

type Invoice = {
  id: string;
  number: string | null;
  status: string;
  amountPaid: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

const StatusDropdown = ({ linkId, currentStatus, onStatusChange, t }: { linkId: string; currentStatus: string; onStatusChange: (id: string, status: string) => void; t: any }) => {
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
    if (status === 'LIVE') return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981', label: t('dash.live') };
    if (status === 'REMOVED') return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e', label: t('dash.removed') };
    if (status === 'DEPARTED') return { bg: '#f5f5f4', text: '#78716c', border: '#e7e5e4', dot: '#a8a29e', label: t('dash.departed') };
    return { bg: '#f5f5f4', text: '#78716c', border: '#e7e5e4', dot: '#a8a29e', label: t('dash.unknown') };
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
  const { t } = useLanguage();
  const { workspace } = useAuth();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'GIVEN' | 'RECEIVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'REMOVED' | 'DEPARTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    api.get('/api/billing/status').then(res => setBillingStatus(res.data)).catch(() => {});
    api.get('/api/billing/invoices').then(res => setInvoices(res.data.invoices)).catch(() => {}).finally(() => setBillingLoading(false));
  }, []);

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
    { value: 'ALL', label: t('inbox.filterAll') },
    { value: 'RECEIVED', label: t('inbox.backlinkIn') },
    { value: 'GIVEN', label: t('inbox.backlinkOut') },
  ];

  const statusFilters = [
    { value: 'ALL', label: t('inbox.filterAll'), dot: null },
    { value: 'LIVE', label: t('dash.live'), dot: '#22c55e' },
    { value: 'REMOVED', label: t('dash.removed'), dot: '#ef4444' },
    { value: 'DEPARTED', label: t('dash.departed'), dot: '#374151' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>

      {/* Page Header */}
      <div style={{ padding: '28px 32px 0 32px' }}>
        <h1 style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
          {t('dash.title')}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
          {t('dash.subtitle')}
        </p>
      </div>

      {/* Subscription Section */}
      <div style={{ margin: '20px 32px 0 32px' }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('dash.subscription')}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {billingLoading ? '…' : billingStatus?.isSubscribed
                  ? t('billing.planName')
                  : billingStatus?.isTrialActive
                  ? t('billing.trialActive').replace('{n}', String(billingStatus.trialDaysLeft))
                  : t('billing.trialExpired')}
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 30, background: 'var(--border)' }} />

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('dash.lastPayment')}</div>
            {billingLoading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            ) : invoices.length > 0 ? (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize',
                  background: invoices[0].status === 'paid' ? 'rgba(0,184,153,0.15)' : 'rgba(239,68,68,0.15)',
                  color: invoices[0].status === 'paid' ? 'var(--accent)' : 'var(--red)',
                }}>
                  {invoices[0].status}
                </span>
                <span>
                  {(invoices[0].amountPaid / 100).toFixed(2)} {invoices[0].currency.toUpperCase()} · {new Date(invoices[0].created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('dash.noInvoices')}</div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            {invoices.slice(0, 3).map(inv => (
              <a
                key={inv.id}
                href={inv.invoicePdf || inv.hostedInvoiceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title={`${t('dash.invoice')} · ${new Date(inv.created).toLocaleDateString()}`}
                style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <FileText size={16} />
              </a>
            ))}
            <Link href="/billing" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
              {t('dash.viewBilling')}
            </Link>
          </div>
        </div>
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
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginRight: 4 }}>{t('dash.filterType')}</span>

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
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginRight: 4 }}>{t('dash.filterStatus')}</span>

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
          {filteredLinks.length} {t('dash.linksCount')}
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
            <h3>{t('dash.noWebsites')}</h3>
            <p>{t('dash.noWebsitesDesc')}</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 12 }}><ExternalLink /></div>
            <h3>{t('dash.noWebsites')}</h3>
            <p>{t('dash.noWebsitesDesc')}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[t('dash.hFrom'), t('dash.hTo'), t('dash.hAnchor'), t('dash.hDate'), t('dash.hChat'), t('dash.hStatus')].map((h, index) => (
                  <th key={index} style={{
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
                          {t('dash.showChat')}
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
                        <StatusDropdown linkId={link.id} currentStatus={link.status} onStatusChange={handleStatusChange} t={t} />
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
