'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronRight, Star, Send } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function FeedbackPage() {
  const { t } = useLanguage();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  
  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

  // Form State
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [recommend, setRecommend] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch History
  useEffect(() => {
    if (activeTab === 'history' && !hasFetchedHistory) {
      setIsLoadingHistory(true);
      api.get('/api/feedback')
        .then(res => {
          setHistory(res.data);
          setHasFetchedHistory(true);
        })
        .catch(err => console.error('Failed to load history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, hasFetchedHistory]);

  const handleSubmit = async () => {
    if (!topic || !message.trim()) {
      setError('Please select a topic and enter your feedback.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await api.post('/api/feedback', {
        topic,
        message: message.trim(),
        rating,
        recommend
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
      
      // Clear form
      setTopic('');
      setMessage('');
      setRating(0);
      setRecommend('');
      
      // Prepend to history if loaded, otherwise let the fetch handle it when they open the tab
      if (hasFetchedHistory) {
        setHistory([res.data.feedback, ...history]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: 'var(--font-lato, Lato, sans-serif)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: '"Poppins", sans-serif' }}>
          {t('feed.title')}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto', lineHeight: 1.6 }}>
          {t('feed.desc')}
        </p>
      </div>

      {/* Main Card */}
      <div style={{ 
        background: 'var(--bg-surface)', 
        borderRadius: '12px', 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        padding: '40px',
        margin: '0 auto'
      }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('form')}
            style={{ 
              background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'form' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'form' ? '2px solid var(--text-primary)' : '2px solid transparent'
            }}
          >
            {t('feed.yourFeedback')}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'history' ? '2px solid var(--text-primary)' : '2px solid transparent'
            }}
          >
            History
          </button>
        </div>

        {activeTab === 'form' && (
          <div>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 0 }}>{t('feed.whatAbout')}</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="input-field" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{ background: 'transparent', color: 'var(--text-primary)', appearance: 'none', width: '100%', paddingRight: '40px' }}
                >
                  <option value="" disabled style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('feed.selectTopic')}</option>
                  <option value="bug" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('feed.bugReport')}</option>
                  <option value="feature" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('feed.featureReq')}</option>
                  <option value="other" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('feed.other')}</option>
                </select>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 0 }}>
                {t('feed.yourFeedback')} <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <textarea 
                className="input-field" 
                placeholder={t('feed.placeholder')}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: 'vertical', background: 'transparent', color: 'var(--text-primary)' }}
              ></textarea>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {message.length} / 1000
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('feed.rateExp')}</label>
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '50px' }} onClick={() => setRating(star)}>
                    <Star size={30} color={star <= rating ? 'var(--text-muted)' : 'var(--border)'} fill={star <= rating ? 'var(--text-muted)' : 'none'} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', opacity: (star === 1 || star === 5) ? 1 : 0 }}>
                      {star === 1 ? t('feed.veryBad') : star === 5 ? t('feed.excellent') : '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{t('feed.recommend')}</label>
              <div style={{ display: 'flex', gap: '32px' }}>
                {['yes', 'no', 'maybe'].map((option) => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <input type="radio" name="recommend" value={option} checked={recommend === option} onChange={() => setRecommend(option)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                    {t(`feed.${option}`)}
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1rem', background: 'var(--text-primary)', color: 'var(--bg-surface)', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: 'none', opacity: isSubmitting ? 0.7 : 1 }}
            >
              <Send size={18} />
              {isSubmitting ? 'Submitting...' : t('feed.submit')}
            </button>

          </div>
        )}

        {/* Success Toast */}
        {submitted && (
          <div style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            boxShadow: 'var(--shadow-lg)',
            padding: '16px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
          }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--green)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {t('feed.success') || 'Feedback submitted successfully!'}
            </span>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {isLoadingHistory ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>You haven't submitted any feedback yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map((item) => (
                  <div key={item.id} style={{ padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {item.topic === 'bug' ? t('feed.bugReport') : item.topic === 'feature' ? t('feed.featureReq') : t('feed.other')}
                      </span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {item.message}
                    </p>
                    {item.rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} color={i < item.rating ? 'var(--text-muted)' : 'var(--border)'} fill={i < item.rating ? 'var(--text-muted)' : 'none'} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
