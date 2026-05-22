'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Globe, Search, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Workspace = { id: string; domain: string; websiteName: string; description: string; niche?: string; country?: string };

export default function DiscoverPage() {
  const { workspace } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/workspaces')
      .then(r => setWorkspaces(r.data.workspaces.filter((w: Workspace) => w.id !== workspace?.id)))
      .finally(() => setLoading(false));
  }, [workspace]);

  const filtered = workspaces.filter(w =>
    w.domain.toLowerCase().includes(search.toLowerCase()) ||
    w.websiteName.toLowerCase().includes(search.toLowerCase()) ||
    (w.niche || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async (receiverWorkspaceId: string) => {
    setSending(receiverWorkspaceId);
    try {
      await api.post('/api/threads', { receiverWorkspaceId });
      router.push('/inbox');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to send request');
    } finally { setSending(null); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Discover</h1>
          <p className="page-sub">Find partner sites for backlink exchanges</p>
        </div>
      </div>

      <div style={{ padding:'16px 32px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ position:'relative', maxWidth:400 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field" style={{ paddingLeft:36 }} placeholder="Search by domain, name, or niche…" />
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 32px' }}>
        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Globe /></div>
            <h3>No sites found</h3>
            <p>Try a different search term or invite partners to join LinkLoop.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {filtered.map(w => (
              <div key={w.id} className="card card-hover" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:42, height:42, background:'linear-gradient(135deg, var(--accent), #a855f7)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {w.domain.substring(0,2).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontWeight:700 }}>{w.websiteName}</p>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{w.domain}</p>
                  </div>
                </div>
                {w.description && (
                  <p style={{ fontSize:'0.8125rem', color:'var(--text-secondary)', lineHeight:1.5, marginBottom:12 }}>{w.description}</p>
                )}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {w.niche && <span className="pill pill-new">{w.niche}</span>}
                  {w.country && <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>📍 {w.country}</span>}
                </div>
                <button
                  id={`connect-${w.id}`}
                  onClick={() => handleConnect(w.id)}
                  className="btn btn-primary btn-sm"
                  style={{ width:'100%', justifyContent:'center' }}
                  disabled={sending === w.id}>
                  {sending === w.id ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                  {sending === w.id ? 'Sending…' : 'Send Exchange Request'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
