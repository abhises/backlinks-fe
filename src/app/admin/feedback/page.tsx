'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Star, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminFeedbackPage() {
  const { t } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/feedback');
      setFeedbacks(res.data.feedback);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading feedback...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'var(--red)' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquare size={24} color="var(--accent)" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('admin.feedback') || 'User Feedback'}
        </h1>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
              <th style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Topic</th>
              <th style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rating</th>
              <th style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No feedback found.
                </td>
              </tr>
            ) : (
              feedbacks.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.user?.email}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize', verticalAlign: 'top' }}>
                    {item.topic}
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'top' }}>
                    {item.rating > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} color={i < item.rating ? 'var(--text-muted)' : 'var(--border)'} fill={i < item.rating ? 'var(--text-muted)' : 'none'} />
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', verticalAlign: 'top' }}>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '100px', overflowY: 'auto' }}>
                      {item.message}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
