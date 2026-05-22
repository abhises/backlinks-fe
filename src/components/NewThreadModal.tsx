'use client';
import { useState, useEffect } from 'react';
import { X, Globe, Loader2, Search } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Workspace = { id: string; domain: string; websiteName: string; description: string; niche?: string };

export default function NewThreadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { workspace } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/workspaces')
      .then(r => setWorkspaces(r.data.workspaces.filter((w: Workspace) => w.id !== workspace?.id)))
      .finally(() => setFetching(false));
  }, [workspace]);

  const filtered = workspaces.filter(w =>
    w.domain.toLowerCase().includes(search.toLowerCase()) ||
    w.websiteName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      await api.post('/api/threads', { receiverWorkspaceId: selected.id });
      onCreated(); onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send request');
    } finally { setLoading(false); }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" style={{ padding:28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3>New Connection Request</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', marginBottom:16 }}>
          You&apos;ll be listed as the <strong style={{ color:'var(--accent)' }}>Giver</strong> — the site hosting the link.
        </p>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field" style={{ paddingLeft:36 }} placeholder="Search by domain or name…" autoFocus />
        </div>

        {error && <p style={{ color:'var(--red)', fontSize:'0.875rem', marginBottom:12 }}>{error}</p>}

        {/* List */}
        <div style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {fetching ? (
            <div style={{ display:'flex', justifyContent:'center', padding:24 }}>
              <Loader2 size={20} className="animate-spin" style={{ color:'var(--accent)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:24, fontSize:'0.875rem' }}>No sites found</p>
          ) : filtered.map(w => (
            <div key={w.id}
              onClick={() => setSelected(w)}
              style={{
                padding:'12px 14px', borderRadius:'var(--radius-sm)', cursor:'pointer',
                border:`1px solid ${selected?.id === w.id ? 'var(--accent)' : 'var(--border)'}`,
                background: selected?.id === w.id ? 'var(--accent-glow)' : 'var(--bg-hover)',
                transition:'all 0.15s ease',
              }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, background:'linear-gradient(135deg, var(--accent), #a855f7)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {w.domain.substring(0,2).toUpperCase()}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:'0.875rem' }}>{w.websiteName}</p>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{w.domain} {w.niche ? `· ${w.niche}` : ''}</p>
                </div>
                <Globe size={14} style={{ color:'var(--text-muted)', marginLeft:'auto', flexShrink:0 }} />
              </div>
              {w.description && (
                <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:6, paddingLeft:44 }}>{w.description}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button id="send-request-btn" onClick={handleSend} className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={!selected || loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {selected ? `Send to ${selected.domain}` : 'Select a site'}
          </button>
        </div>
      </div>
    </div>
  );
}
