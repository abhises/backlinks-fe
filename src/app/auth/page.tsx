'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Link2, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, workspace } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        router.replace(workspace ? '/inbox' : '/onboarding');
      } else {
        await register(name, email, password);
        router.replace('/onboarding');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* background grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.3, pointerEvents:'none' }} />

      <div className="auth-card animate-slide-up">
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <div className="logo-icon"><Link2 size={18} color="#fff" /></div>
          <span className="logo-text">LinkLoop</span>
        </div>

        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
          {mode === 'login' ? 'Sign in to your workspace' : 'Start your backlink exchange journey'}
        </p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input id="auth-name" type="text" value={name} onChange={e=>setName(e.target.value)}
                  className="input-field" style={{ paddingLeft:36 }} placeholder="Jane Smith" required />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position:'relative' }}>
              <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input id="auth-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                className="input-field" style={{ paddingLeft:36 }} placeholder="jane@example.com" required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position:'relative' }}>
              <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input id="auth-password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
                className="input-field" style={{ paddingLeft:36 }} placeholder="••••••••" required minLength={6} />
            </div>
          </div>

          <button id="auth-submit" type="submit" className="btn btn-primary" style={{ justifyContent:'center', marginTop:4 }} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m==='login'?'register':'login'); setError(''); }}
            style={{ color:'var(--accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
