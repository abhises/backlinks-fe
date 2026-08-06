'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
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

export default function BillingPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizingCheckout, setFinalizingCheckout] = useState(checkoutResult === 'success');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ padding: '4px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('billing.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{t('billing.subtitle')}</p>
      </div>

      {checkoutResult === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid var(--green)', color: 'var(--green)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.875rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> {t('billing.checkoutSuccess')}
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.875rem', fontWeight: 600 }}>
          {t('billing.checkoutCancelled')}
        </div>
      )}

      {finalizingCheckout && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.875rem', fontWeight: 600 }}>
          <Loader2 size={16} className="animate-spin" /> {t('billing.finalizingCheckout')}
        </div>
      )}

      {status && !status.hasAccess && !finalizingCheckout && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.875rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700 }}>{t('billing.trialExpired')}</p>
            <p style={{ marginTop: 2, color: 'var(--text-secondary)' }}>{t('billing.trialExpiredDesc')}</p>
          </div>
        </div>
      )}

      {status?.subscriptionStatus === 'PAST_DUE' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid var(--red)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: '0.875rem', fontWeight: 600 }}>
          <ShieldAlert size={18} /> {t('billing.pastDue')}
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
        <span className="pill pill-live" style={{ fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={12} /> {t('billing.planName')}
        </span>

        <p style={{ marginTop: 16, fontSize: '2rem', fontWeight: 800 }}>
          {t('billing.planPrice')}
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('billing.planPeriod')}</span>
        </p>

        <p style={{ marginTop: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {status?.isSubscribed
            ? (status.cancelAtPeriodEnd
              ? t('billing.cancelsIn').replace('{n}', String(status.daysUntilRenewal))
              : t('billing.renewsIn').replace('{n}', String(status.daysUntilRenewal)))
            : status?.isTrialActive
            ? t('billing.trialActive').replace('{n}', String(status.trialDaysLeft))
            : t('billing.trialExpired')}
        </p>

        {status?.isSubscribed ? (
          <button
            className="btn btn-secondary"
            onClick={handleManageBilling}
            disabled={checkoutLoading}
            style={{ marginTop: 24, width: 'fit-content', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {checkoutLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {checkoutLoading ? t('billing.redirecting') : t('billing.manageBilling')}
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
    </div>
  );
}
