'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Bell, Send, Loader2, Clock } from 'lucide-react';

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export default function AdminNotifications() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<AdminNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/admin/notifications');
      setHistory(res.data.notifications);
    } catch (err) {
      console.error('Failed to load notification history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await api.post('/api/admin/notifications', { title, description });
      setSuccess(t('adminNotifs.success'));
      setTitle('');
      setDescription('');
      
      // Add the new notification to the top of the history
      if (res.data.notification) {
        setHistory(prev => [res.data.notification, ...prev]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || t('adminNotifs.failedBroadcast'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notifications-container">
      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">{t('adminNotifs.title')}</h1>
          <p className="page-sub">{t('adminNotifs.sub')}</p>
        </div>
      </div>

      <div className="notifications-grid">
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="var(--blue)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminNotifs.newAnnouncement')}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('adminNotifs.announcementDesc')}</p>
          </div>
        </div>

        {success && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--green)' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">{t('adminNotifs.formTitle')}</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="input-field" 
              placeholder={t('adminNotifs.formTitlePlaceholder')} 
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('adminNotifs.formDesc')}</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="input-field" 
              placeholder={t('adminNotifs.formDescPlaceholder')} 
              required 
              rows={4}
              style={{ resize: 'vertical', lineHeight: 1.5 }} 
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              alignSelf: 'flex-start', 
              padding: '12px 32px', 
              fontSize: '0.9375rem',
              background: '#1a1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: (loading || !title || !description) ? 'not-allowed' : 'pointer',
              opacity: (loading || !title || !description) ? 0.7 : 1,
              fontWeight: 600
            }} 
            disabled={loading || !title || !description}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? t('adminNotifs.broadcasting') : t('adminNotifs.sendBroadcast')}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 24 }}>{t('adminNotifs.historyTitle')}</h2>
        
        {loadingHistory ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon" style={{ background: 'var(--bg-hover)' }}><Clock color="var(--text-muted)" /></div>
            <h3>{t('adminNotifs.noBroadcasts')}</h3>
            <p>{t('adminNotifs.noBroadcastsDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map(item => (
              <div key={item.id} style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
