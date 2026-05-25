'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Link2, Mail, Lock, User, ArrowRight, Loader2, Sun, Moon, Palette } from 'lucide-react';

export default function AuthPage() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'color'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as 'dark' | 'light' | 'color') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'color' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Palette;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle, workspace } = useAuth();
  const router = useRouter();

  const initGoogleSignIn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1036829497479-placeholder.apps.googleusercontent.com',
        callback: (window as any).handleGoogleResponse,
      });
      const btnParent = document.getElementById('google-signin-btn');
      if (btnParent) {
        (window as any).google.accounts.id.renderButton(
          btnParent,
          { 
            theme: theme === 'light' ? 'outline' : 'filled_black', 
            size: 'large', 
            width: btnParent.clientWidth || 360,
            text: mode === 'login' ? 'signin_with' : 'signup_with'
          }
        );
      }
    }
  };

  useEffect(() => {
    // Define the global callback
    (window as any).handleGoogleResponse = async (response: any) => {
      setError('');
      setLoading(true);
      try {
        const { user: loggedInUser, workspace: ws } = await loginWithGoogle(response.credential);
        if (loggedInUser?.role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace(ws ? '/inbox' : '/onboarding');
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Google sign in failed');
      } finally {
        setLoading(false);
      }
    };

    // Render/initialize button if google SDK is already loaded
    if ((window as any).google) {
      initGoogleSignIn();
    }

    return () => {
      delete (window as any).handleGoogleResponse;
    };
  }, [theme, mode, loginWithGoogle, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'register' || m === 'login') {
        setMode(m);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { user: loggedInUser, workspace: ws } = await login(email, password);
        if (loggedInUser?.role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace(ws ? '/inbox' : '/onboarding');
        }
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

      {/* Floating Theme Toggle in Top Right */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }}>
        <button 
          onClick={cycleTheme} 
          className="btn btn-secondary btn-icon" 
          title="Cycle Theme"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, padding: 0, borderRadius: 'var(--radius-sm)' }}
        >
          <ThemeIcon size={16} />
        </button>
      </div>

      <div className="auth-card animate-slide-up">
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <div className="logo-icon"><Link2 size={18} color="#fff" /></div>
          <span className="logo-text">SERPsupport</span>
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

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 12px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Google Sign In Button */}
        <div 
          id="google-signin-btn" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 12, minHeight: 40 }}
        />

        <div className="divider" />

        <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m==='login'?'register':'login'); setError(''); }}
            style={{ color:'var(--accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <Script 
        src="https://accounts.google.com/gsi/client" 
        onLoad={initGoogleSignIn}
        strategy="lazyOnload"
      />
    </div>
  );
}
