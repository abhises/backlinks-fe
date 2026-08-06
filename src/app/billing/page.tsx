'use client';
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

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

type BillingStatus = {
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  TRIALING: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue)' },
  ACTIVE: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)' },
  PAST_DUE: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' },
  CANCELED: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)' },
  EXPIRED: { bg: 'var(--bg-hover)', color: 'var(--text-muted)' },
};

export default function BillingPage() {
  const { t } = useLanguage();
  const { user, workspace } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/billing/status').then(res => setStatus(res.data)).catch(() => {});
    api.get('/api/billing/invoices')
      .then(res => setInvoices(res.data.invoices))
      .catch((err) => setError(err?.response?.data?.error || t('billing.failedLoadInvoices')));
  }, []);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'TRIALING': return t('adminSubscriptions.statTrialing');
      case 'ACTIVE': return t('adminSubscriptions.statActive');
      case 'PAST_DUE': return t('adminSubscriptions.statPastDue');
      case 'CANCELED': return t('adminSubscriptions.statCanceled');
      default: return s;
    }
  };

  const lastInvoice = invoices[0] || null;
  const statusStyle = status ? (STATUS_STYLES[status.subscriptionStatus] || STATUS_STYLES.EXPIRED) : STATUS_STYLES.EXPIRED;

  return (
    <div style={{ width: '100%', padding: '28px 32px 40px' }}>
      <div style={{ padding: '4px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 32, textAlign: 'left' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('app.subscription')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 8 }}>{t('billing.invoiceHistorySubtitle')}</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.9rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Subscription details table - same fields as the admin Subscriptions table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('adminSubscriptions.hWebsite'), t('adminSubscriptions.hEmail'), t('adminSubscriptions.hStatus'), t('adminSubscriptions.hTrialEnds'), t('adminSubscriptions.hLastPayment'), t('adminSubscriptions.hStripe')].map((h, idx) => (
                <th key={idx} style={{
                  padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-base)',
                  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                {workspace ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{workspace.domain}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{workspace.websiteName}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>{t('adminSubscriptions.noWorkspace')}</span>
                )}
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.email}</td>
              <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                {status && (
                  <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: statusStyle.bg, color: statusStyle.color }}>
                    {statusLabel(status.subscriptionStatus)}
                  </span>
                )}
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {status?.trialEndsAt ? new Date(status.trialEndsAt).toLocaleDateString() : '—'}
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                {lastInvoice ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {(lastInvoice.amountPaid / 100).toFixed(2)} {lastInvoice.currency.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(lastInvoice.created).toLocaleDateString()}</span>
                    {(lastInvoice.hostedInvoiceUrl || lastInvoice.invoicePdf) && (
                      <a href={lastInvoice.invoicePdf || lastInvoice.hostedInvoiceUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        {t('adminSubscriptions.viewInvoice')} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>{t('adminSubscriptions.noPayment')}</span>
                )}
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {status?.stripeCustomerId || '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
