'use client';
import { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import api from '@/lib/api';
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

export default function BillingPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/billing/invoices')
      .then(res => setInvoices(res.data.invoices))
      .catch((err) => setError(err?.response?.data?.error || t('billing.failedLoadInvoices')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ padding: '4px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('billing.invoiceHistory')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 8 }}>{t('billing.invoiceHistorySubtitle')}</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.9rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon" style={{ background: 'var(--bg-hover)' }}><FileText color="var(--text-muted)" /></div>
            <h3>{t('billing.noInvoices')}</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {invoices.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {(inv.amountPaid / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(inv.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize',
                    background: inv.status === 'paid' ? 'rgba(0,184,153,0.15)' : 'rgba(239,68,68,0.15)',
                    color: inv.status === 'paid' ? 'var(--accent)' : 'var(--red)',
                  }}>
                    {inv.status}
                  </span>
                  {(inv.hostedInvoiceUrl || inv.invoicePdf) && (
                    <a
                      href={inv.invoicePdf || inv.hostedInvoiceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      {t('billing.viewInvoice')}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
