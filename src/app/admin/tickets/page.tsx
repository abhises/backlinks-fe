'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { LifeBuoy, Loader2, Clock, Check } from 'lucide-react';

type Ticket = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

export default function AdminTickets() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/admin/tickets');
      setTickets(res.data.tickets);
    } catch (err: any) {
      setError(err?.response?.data?.error || t('adminTickets.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.put(`/api/admin/tickets/${id}/resolve`);
      setTickets(prev => prev.map(ticket => ticket.id === id ? { ...ticket, status: 'RESOLVED' } : ticket));
    } catch (err) {
      console.error('Failed to resolve ticket', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="notifications-container">
      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">{t('adminTickets.title')}</h1>
          <p className="page-sub">{t('adminTickets.sub')}</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon" style={{ background: 'var(--bg-hover)' }}><LifeBuoy color="var(--text-muted)" /></div>
            <h3>{t('adminTickets.noTickets')}</h3>
            <p>{t('adminTickets.noTicketsDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {tickets.map(ticket => (
              <div key={ticket.id} style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t('adminTickets.from')}: {ticket.user.name} ({ticket.user.email})
                    </h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      <Clock size={12} /> {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="pill" style={{ fontSize: '0.7rem', fontWeight: 700, color: ticket.status === 'OPEN' ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {ticket.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginTop: 8 }}>
                  {ticket.message}
                </p>
                {ticket.status === 'OPEN' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleResolve(ticket.id)}
                    disabled={resolvingId === ticket.id}
                    style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {resolvingId === ticket.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {t('adminTickets.markResolved')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
