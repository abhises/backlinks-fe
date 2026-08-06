'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldAlert, Sparkles, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

type BillingStatus = {
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  trialEndsAt: string | null;
  isTrialActive: boolean;
  trialDaysLeft: number;
  hasAccess: boolean;
  isSubscribed: boolean;
  renewalDate: string | null;
  daysUntilRenewal: number;
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

export default function BillingPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizingCheckout, setFinalizingCheckout] = useState(checkoutResult === 'success');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  useEffect(() => {
    api.get('/api/billing/invoices')
      .then(res => setInvoices(res.data.invoices))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Stripe redirects back the instant checkout completes, but the webhook that
    // marks the subscription ACTIVE in our DB arrives asynchronously and can lag
    // behind that redirect — so right after ?checkout=success, status.hasAccess
    // may still read stale/false for a moment. Poll briefly until it catches up.
    const run = async () => {
      const isSuccessRedirect = checkoutResult === 'success';
      const maxAttempts = isSuccessRedirect ? 6 : 1;
      const delayMs = 1500;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await api.get('/api/billing/status');
          if (cancelled) return;
          setStatus(res.data);
          setLoading(false);
          if (res.data.hasAccess) {
            setFinalizingCheckout(false);
            return;
          }
        } catch {
          // ignore, handled by global 401 redirect if unauthenticated
          if (cancelled) return;
          setLoading(false);
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      if (!cancelled) setFinalizingCheckout(false);
    };

    run();
    return () => { cancelled = true; };
  }, [checkoutResult]);

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/billing/create-checkout-session');
      window.location.href = res.data.url;
    } catch {
      setError(t('billing.checkoutError'));
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/billing/create-portal-session');
      window.location.href = res.data.url;
    } catch {
      setError(t('billing.checkoutError'));
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 800 }}>
        <div style={{ padding: '4px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('billing.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 8 }}>{t('billing.subtitle')}</p>
        </div>

        {checkoutResult === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green)', color: 'var(--green)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '1rem', fontWeight: 600 }}>
            <CheckCircle2 size={20} /> {t('billing.checkoutSuccess')}
          </div>
        )}
        {checkoutResult === 'cancelled' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '1rem', fontWeight: 600 }}>
            {t('billing.checkoutCancelled')}
          </div>
        )}

        {finalizingCheckout && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '1rem', fontWeight: 600 }}>
            <Loader2 size={20} className="animate-spin" /> {t('billing.finalizingCheckout')}
          </div>
        )}

        {status && !status.hasAccess && !finalizingCheckout && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '1rem' }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700 }}>{t('billing.trialExpired')}</p>
              <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{t('billing.trialExpiredDesc')}</p>
            </div>
          </div>
        )}

        {status?.subscriptionStatus === 'PAST_DUE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '1rem', fontWeight: 600 }}>
            <ShieldAlert size={20} /> {t('billing.pastDue')}
          </div>
        )}

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 40px 40px', minHeight: 480, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="pill pill-live" style={{ fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} /> {t('billing.planName')}
          </span>
          {status?.isSubscribed && (
            <span className="pill pill-live" style={{ fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {t('settings.updateCard')}
            </span>
          )}
        </div>

        {!status?.isSubscribed && (
          <p style={{ marginTop: 16, fontSize: '2rem', fontWeight: 800 }}>
            {t('billing.planPrice')}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('billing.planPeriod')}</span>
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {status?.isSubscribed
            ? (status.cancelAtPeriodEnd
              ? t('billing.cancelsIn').replace('{n}', String(status.daysUntilRenewal))
              : t('billing.renewsIn').replace('{n}', String(status.daysUntilRenewal)))
            : status?.isTrialActive
            ? t('billing.trialActive').replace('{n}', String(status.trialDaysLeft))
            : t('billing.trialExpired')}
        </p>

        <ul style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none', padding: 0, textAlign: 'left', width: '100%', maxWidth: 380 }}>
          {[t('billing.feature1'), t('billing.feature2'), t('billing.feature3')].map((feature, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              {feature}
            </li>
          ))}
        </ul>

        {status?.isSubscribed ? (
          <button
            className="btn btn-secondary"
            onClick={handleManageBilling}
            disabled={checkoutLoading}
            style={{ marginTop: 24, width: 'fit-content', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {checkoutLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {checkoutLoading ? t('billing.redirecting') : t('settings.updateCard')}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            style={{ marginTop: 24, width: 'fit-content', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {checkoutLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {checkoutLoading ? t('billing.redirecting') : t('billing.subscribeBtn')}
          </button>
        )}

        {error && (
          <p style={{ marginTop: 12, color: 'var(--red)', fontSize: '0.8125rem', fontWeight: 600 }}>{error}</p>
        )}
        </div>

        {!invoicesLoading && invoices.length > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, marginTop: 24 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>{t('billing.invoiceHistory')}</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              {t('billing.lastPayment')}: {' '}
              <span style={{
                fontWeight: 700, textTransform: 'capitalize',
                color: invoices[0].status === 'paid' ? 'var(--accent)' : 'var(--red)',
              }}>
                {invoices[0].status}
              </span>
            </p>

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
          </div>
        )}
      </div>
    </div>
  );
}
