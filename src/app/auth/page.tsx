'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Script from 'next/script';
import Link from 'next/link';
import api from '@/lib/api';
import { Link2, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sun, Moon, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as 'light' | 'dark') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle, workspace } = useAuth();
  const { t } = useLanguage();
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
      if (m === 'register' || m === 'login' || m === 'forgot') {
        setMode(m as any);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'forgot') {
        await api.post('/api/auth/forgot-password', { email });
        setForgotSuccess(true);
      } else if (mode === 'login') {
        const { user: loggedInUser, workspace: ws } = await login(email, password);
        if (loggedInUser?.role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace(ws ? '/inbox' : '/onboarding');
        }
      } else {
        await register(email, password);
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

      {/* Floating Back Button in Top Left */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 100 }}>
        <Link 
          href="/" 
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

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
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, textDecoration:'none' }}>
          <Link2 size={28} color="var(--accent)" />
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>SERPsupport</span>
        </Link>

        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>
          {mode === 'forgot' ? t('auth.resetPassword') : mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
          {mode === 'forgot' ? t('auth.resetDesc') : mode === 'login' ? t('auth.loginDesc') : t('auth.registerDesc')}
        </p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        {mode === 'forgot' ? (
          forgotSuccess ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ background: 'rgba(0, 184, 153, 0.1)', border: '1px solid rgba(0, 184, 153, 0.3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>{t('auth.checkInbox')}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {t('auth.checkInboxDesc')} <strong>{email}</strong>
                </p>
              </div>
              <button onClick={() => { setMode('login'); setForgotSuccess(false); }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {t('auth.backToSignIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="input-group">
                <label className="input-label">{t('auth.email')}</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="auth-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    className="input-field" style={{ paddingLeft:36 }} placeholder="jane@example.com" required />
                </div>
              </div>

              <button id="auth-submit" type="submit" className="btn btn-primary" style={{ justifyContent:'center', marginTop:4 }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? t('auth.sendingLink') : t('auth.sendResetLink')}
              </button>
            </form>
          )
        ) : mode === 'register' ? (
          <>
            {/* Google Sign In Button FIRST for Register */}
            <div 
              id="google-signin-btn" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 4, minHeight: 40 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('auth.orContinue')}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="input-group">
                <label className="input-label">{t('auth.email')}</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="auth-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    className="input-field" style={{ paddingLeft:36 }} placeholder="jane@example.com" required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">{t('auth.password')}</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    className="input-field" style={{ paddingLeft:36, paddingRight:36 }} placeholder="••••••••" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', padding:0 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button id="auth-submit" type="submit" className="btn btn-primary" style={{ justifyContent:'center', marginTop:4 }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? t('auth.pleaseWait') : t('auth.startTrial')}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Email Form FIRST for Login */}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="input-group">
                <label className="input-label">{t('auth.email')}</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="auth-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    className="input-field" style={{ paddingLeft:36 }} placeholder="jane@example.com" required />
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>{t('auth.password')}</label>
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setForgotSuccess(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div style={{ position:'relative', marginTop: 6 }}>
                  <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    className="input-field" style={{ paddingLeft:36, paddingRight:36 }} placeholder="••••••••" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', padding:0 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button id="auth-submit" type="submit" className="btn btn-primary" style={{ justifyContent:'center', marginTop:4 }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? t('auth.pleaseWait') : t('auth.signIn')}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 12px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('auth.or')}</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Google Sign In Button BELOW for Login */}
            <div 
              id="google-signin-btn" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 12, minHeight: 40 }}
            />
          </>
        )}

        {mode !== 'forgot' && <div className="divider" />}

        <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)', marginTop: mode === 'forgot' ? 24 : 0 }}>
          {mode === 'forgot' ? (
            <button onClick={() => { setMode('login'); setError(''); setForgotSuccess(false); }}
              style={{ color:'var(--accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
              ← {t('auth.backToSignIn')}
            </button>
          ) : (
            <>
              {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
              <button onClick={() => { setMode(m => m==='login'?'register':'login'); setError(''); }}
                style={{ color:'var(--accent)', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>
                {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
              </button>
            </>
          )}
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
