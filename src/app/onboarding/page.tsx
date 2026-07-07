'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Link2, Globe, Sparkles, Loader2 } from 'lucide-react';
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
      const res = await api.post('/api/workspaces', { domain, websiteName: domain, description });
      setWorkspace(res.data.workspace);
      router.replace('/inbox');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.3, pointerEvents:'none' }} />

      <div className="auth-card animate-slide-up" style={{ maxWidth:520 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <Link2 size={28} color="var(--accent)" />
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>SERPsupport</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <Sparkles size={18} color="var(--accent)" />
          <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>
            {t('onboard.title')}
          </h2>
        </div>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
          {t('onboard.subtitle')}
        </p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="input-group">
              <label className="input-label">Root Domain</label>
              <div style={{ position:'relative' }}>
                <Globe size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input id="ob-domain" type="text" value={domain} onChange={e=>setDomain(e.target.value)}
                  className="input-field" style={{ paddingLeft:36 }} placeholder="fernway.io" required />
              </div>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>No https:// or trailing slash needed</p>
            </div>
            
            <div className="input-group">
              <label className="input-label">One-sentence Description</label>
              <textarea id="ob-desc" value={description} onChange={e=>setDescription(e.target.value)}
                className="input-field" placeholder="Fernway is a productivity blog for remote software teams." required rows={2}
                style={{ resize:'none', lineHeight:1.6 }} />
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Keep it to one sentence — partners will see this.</p>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={logout} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>Back</button>
              <button id="ob-submit" type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? 'Creating…' : t('onboard.complete')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
