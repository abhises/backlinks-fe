'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, workspace, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth'); return; }
    if (!workspace) { router.replace('/onboarding'); return; }
    router.replace('/inbox');
  }, [user, workspace, loading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--accent), #a855f7)', borderRadius: 12, animation: 'pulse-glow 2s infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading LinkLoop…</p>
      </div>
    </div>
  );
}
