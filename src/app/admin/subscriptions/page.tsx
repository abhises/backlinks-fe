'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, CreditCard, Search, ExternalLink } from 'lucide-react';

type Subscription = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  workspace: { domain: string; websiteName: string } | null;
  lastPayment: {
    amount: number;
    currency: string;
    status: string;
    date: string;
    hostedInvoiceUrl: string | null;
  } | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  TRIALING: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue)' },
  ACTIVE: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)' },
  PAST_DUE: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
  CANCELED: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)' },
  EXPIRED: { bg: 'var(--bg-hover)', color: 'var(--text-muted)' },
};

export default function AdminSubscriptions() {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    api.get('/api/admin/subscriptions')
      .then(res => setSubscriptions(res.data.subscriptions))
      .catch((err) => setError(err?.response?.data?.error || t('adminSubscriptions.failedLoad')))
      .finally(() => setLoading(false));
  }, []);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'TRIALING': return t('adminSubscriptions.statTrialing');
      case 'ACTIVE': return t('adminSubscriptions.statActive');
      case 'PAST_DUE': return t('adminSubscriptions.statPastDue');
      case 'CANCELED': return t('adminSubscriptions.statCanceled');
      default: return status;
    }
  };

  const filtered = subscriptions.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.workspace?.domain.toLowerCase().includes(q) ||
      s.workspace?.websiteName.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const counts = subscriptions.reduce((acc, s) => {
    acc[s.subscriptionStatus] = (acc[s.subscriptionStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      <div style={{ padding: '28px 32px 0 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: '"Lora", "Georgia", serif', fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{t('adminSubscriptions.title')}</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>{t('adminSubscriptions.sub')}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('adminSubscriptions.search')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input-field"
            style={{ paddingLeft: 40, width: 300, background: 'var(--bg-surface)' }}
          />
        </div>
      </div>

      {!loading && subscriptions.length > 0 && (
        <div style={{ padding: '0 32px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'] as const).map(status => (
            <div key={status} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', minWidth: 110 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: STATUS_STYLES[status].color }}>{counts[status] || 0}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{statusLabel(status).toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 40px 32px' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="empty-state-icon" style={{ background: 'var(--bg-hover)', display: 'inline-flex', padding: 20, borderRadius: '50%', marginBottom: 16 }}><CreditCard color="var(--text-muted)" size={48} /></div>
              <h3>{searchQuery ? t('adminSubscriptions.noMatch') : t('adminSubscriptions.noSubscriptions')}</h3>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[t('adminSubscriptions.hWebsite'), t('adminSubscriptions.hEmail'), t('adminSubscriptions.hStatus'), t('adminSubscriptions.hTrialEnds'), t('adminSubscriptions.hLastPayment'), t('adminSubscriptions.hStripe')].map((h, idx) => (
                    <th key={idx} style={{
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
                {paginated.map(s => {
                  const style = STATUS_STYLES[s.subscriptionStatus] || STATUS_STYLES.EXPIRED;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {s.workspace ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.workspace.domain}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.workspace.websiteName}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{t('adminSubscriptions.noWorkspace')}</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.email}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: style.bg, color: style.color }}>
                          {statusLabel(s.subscriptionStatus)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {s.lastPayment ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {s.lastPayment.amount.toFixed(2)} {s.lastPayment.currency.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.lastPayment.date).toLocaleDateString()}</span>
                            {s.lastPayment.hostedInvoiceUrl && (
                              <a href={s.lastPayment.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                {t('adminSubscriptions.viewInvoice')} <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{t('adminSubscriptions.noPayment')}</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {s.stripeCustomerId ? (
                          <a
                            href={`https://dashboard.stripe.com/test/customers/${s.stripeCustomerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                          >
                            {t('adminSubscriptions.viewCustomer')} <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {t('inbox.showing')} {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filtered.length)} / {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-secondary btn-sm">
                {t('app.previous')}
              </button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-secondary btn-sm">
                {t('app.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
