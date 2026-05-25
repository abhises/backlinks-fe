'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Users, Globe, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, sites: 0, links: 0 });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
      } finally {
        setFetching(false);
      }
    };
    if (user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  if (loading || fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={32} className="animate-spin" color="var(--accent)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') return null;

  return (
    <div style={{ padding: '32px 40px', overflowY: 'auto' }}>
      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">Platform Overview & Statistics</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        
        {/* Total Users */}
        <div className="card card-hover" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, background: 'var(--accent-glow)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={32} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.users}</h2>
          </div>
        </div>

        {/* Total Sites */}
        <div className="card card-hover" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, background: 'rgba(34, 197, 94, 0.15)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={32} color="var(--green)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Workspaces (Sites)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.sites}</h2>
          </div>
        </div>

        {/* Total Backlinks */}
        <div className="card card-hover" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon size={32} color="var(--blue)" />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backlinks Placed</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{stats.links}</h2>
          </div>
        </div>

      </div>
    </div>
  );
}
