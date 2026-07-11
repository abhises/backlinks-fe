'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Link2, Globe, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function OnboardingPage() {
  const { t } = useLanguage();
  const { user, setWorkspace, logout } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !description) {
      setError('Both fields are required.');
      return;
    }
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanDomain)) {
      setError('Please enter a valid domain (e.g., domain.com, domain.org).');
      return;
    }
    if (description.trim().split('.').filter(Boolean).length > 1 && description.trim().split('!').filter(Boolean).length > 1) {
      setError('Description must be a single sentence.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/workspaces', { domain: cleanDomain, websiteName: cleanDomain, description: description.trim() });
      setWorkspace(res.data.workspace);
      router.replace('/inbox');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.3, pointerEvents:'none' }} />

      <div className="auth-card animate-slide-up" style={{ 
        maxWidth: 520, 
        width: '100%', 
        background: '#222524', 
        border: '1px solid #323634', 
        borderRadius: 16, 
        padding: '36px 36px 32px 36px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: '#419d78', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Link2 size={20} />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
              SERPsupport
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8e9391' }}>
            {t('onboard.step3Indicator') || t('onboard.step2')}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: 24, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {t('onboard.setupProfile')}
        </h1>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Website Domain Input */}
            <div>
              <label htmlFor="ob-domain" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c5c9c7', marginBottom: 8, display: 'block' }}>
                {t('onboard.websiteDomain')}
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8e9391' }} />
                <input
                  id="ob-domain"
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder={t('onboard.domainPlaceholder')}
                  required
                  style={{
                    width: '100%',
                    height: 48,
                    background: '#2c302e',
                    border: '1px solid #383d3b',
                    borderRadius: 8,
                    paddingLeft: 42,
                    paddingRight: 14,
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#419d78'}
                  onBlur={e => e.currentTarget.style.borderColor = '#383d3b'}
                />
              </div>
            </div>

            {/* One-sentence Description Textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label htmlFor="ob-desc" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#c5c9c7' }}>
                  {t('onboard.oneSentenceDesc')}
                </label>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b48a56' }}>
                  {description.length}/140
                </span>
              </div>
              <textarea
                id="ob-desc"
                value={description}
                maxLength={140}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('onboard.descPlaceholder')}
                required
                rows={4}
                style={{
                  width: '100%',
                  background: '#2c302e',
                  border: '1px solid #383d3b',
                  borderRadius: 8,
                  padding: '14px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5,
                  minHeight: 110,
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#419d78'}
                onBlur={e => e.currentTarget.style.borderColor = '#383d3b'}
              />
            </div>

            {/* Launch Button */}
            <button
              id="ob-submit"
              type="submit"
              disabled={loading || !domain.trim() || !description.trim()}
              style={{
                width: '100%',
                height: 42,
                padding: '10px 16px',
                background: '#419d78',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: (loading || !domain.trim() || !description.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !domain.trim() || !description.trim()) ? 0.7 : 1,
                transition: 'filter 0.2s, opacity 0.2s',
                marginTop: 4
              }}
              onMouseEnter={e => {
                if (!loading && domain.trim() && description.trim()) e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'LAUNCHING...' : t('onboard.launchNow')}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push('/onboarding/language')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#c5c9c7',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 0',
                marginTop: 4,
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#c5c9c7'}
            >
              {t('onboard.back')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
