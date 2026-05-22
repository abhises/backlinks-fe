'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Link2, Globe, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const NICHES = ['Tech','Finance','Health','Travel','Fashion','Food','Education','Real Estate','SaaS','Other'];

export default function OnboardingPage() {
  const { user, setWorkspace } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('');
  const [country, setCountry] = useState('');
  const [monthlyTraffic, setMonthlyTraffic] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().split('.').filter(Boolean).length > 1 && description.trim().split('!').filter(Boolean).length > 1) {
      setError('Description must be a single sentence.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/workspaces', { domain, websiteName, description, niche, country, monthlyTraffic });
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
          <div className="logo-icon"><Link2 size={18} color="#fff" /></div>
          <span className="logo-text">LinkLoop</span>
        </div>

        {/* Progress steps */}
        <div style={{ display:'flex', gap:8, marginBottom:28 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex:1, height:4, borderRadius:99,
              background: s <= step ? 'var(--accent)' : 'var(--border)',
              transition:'background 0.3s ease' }} />
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <Sparkles size={18} color="var(--accent)" />
          <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>
            {step === 1 ? 'Set up your workspace' : 'Tell us more (optional)'}
          </h2>
        </div>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
          {step === 1
            ? `Hi ${user?.name?.split(' ')[0] || 'there'}! Let's get your site profile set up.`
            : 'Help partners find you faster with a few extra details.'}
        </p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (!domain || !websiteName || !description) { setError('All three fields are required.'); return; } setError(''); setStep(2); } : handleSubmit}>
          {step === 1 ? (
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
                <label className="input-label">Website Display Name</label>
                <input id="ob-name" type="text" value={websiteName} onChange={e=>setWebsiteName(e.target.value)}
                  className="input-field" placeholder="Fernway" required />
              </div>
              <div className="input-group">
                <label className="input-label">One-sentence Description</label>
                <textarea id="ob-desc" value={description} onChange={e=>setDescription(e.target.value)}
                  className="input-field" placeholder="Fernway is a productivity blog for remote software teams." required rows={2}
                  style={{ resize:'none', lineHeight:1.6 }} />
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Keep it to one sentence — partners will see this.</p>
              </div>
              <button id="ob-next" type="submit" className="btn btn-primary" style={{ justifyContent:'center' }}>
                <ArrowRight size={16} /> Continue
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="input-group">
                <label className="input-label">Niche</label>
                <select id="ob-niche" value={niche} onChange={e=>setNiche(e.target.value)} className="input-field" style={{ cursor:'pointer' }}>
                  <option value="">Select a niche…</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Country</label>
                <input id="ob-country" type="text" value={country} onChange={e=>setCountry(e.target.value)}
                  className="input-field" placeholder="United States" />
              </div>
              <div className="input-group">
                <label className="input-label">Monthly Traffic (approx.)</label>
                <input id="ob-traffic" type="number" value={monthlyTraffic} onChange={e=>setMonthlyTraffic(e.target.value)}
                  className="input-field" placeholder="50000" min={0} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>Back</button>
                <button id="ob-submit" type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? 'Creating…' : 'Launch Workspace'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
