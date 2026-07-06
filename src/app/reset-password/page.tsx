'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Link2, Lock, Eye, EyeOff, ArrowRight, Loader2, Sun, Moon, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background grid */}
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
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, textDecoration:'none' }}>
          <Link2 size={28} color="var(--accent)" />
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>SERPsupport</span>
        </Link>

        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:4 }}>
          {success ? 'Password reset!' : 'Set new password'}
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:28 }}>
          {success ? 'Your password has been updated successfully' : 'Please choose a strong, secure password for your account'}
        </p>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!token && !success && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              This reset link appears to be invalid or missing a token. Please request a new password reset link from the sign in page.
            </p>
            <Link href="/auth?mode=forgot" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              Request New Link
            </Link>
          </div>
        )}

        {token && !success && (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input id="reset-new-password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                  className="input-field" style={{ paddingLeft:36, paddingRight:36 }} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', padding:0 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input id="reset-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                  className="input-field" style={{ paddingLeft:36, paddingRight:36 }} placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            <button id="reset-submit" type="submit" className="btn btn-primary" style={{ justifyContent:'center', marginTop:4 }} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Updating password…' : 'Reset Password'}
            </button>
          </form>
        )}

        {success && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <CheckCircle2 size={48} color="var(--green)" />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Your account password has been changed. You can now log into your SerpSupport workspace using your new credentials.
            </p>
            <Link href="/auth?mode=login" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              Sign In Now
            </Link>
          </div>
        )}

        <div className="divider" style={{ margin: '24px 0 16px' }} />

        <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
          Remembered your password?{' '}
          <Link href="/auth?mode=login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card"><Loader2 size={24} className="animate-spin" /></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
