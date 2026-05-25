'use client';
import { useState } from 'react';
import { X, Link2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

type Thread = {
  id: string;
  giverWorkspace: { id: string; domain: string };
  receiverWorkspace: { id: string; domain: string };
  linkPlacement?: any;
};

const LINK_TYPES = [
  { value:'GUEST_POST', label:'Guest Post' },
  { value:'NICHE_EDIT', label:'Niche Edit' },
  { value:'IMAGE',      label:'Image Link' },
  { value:'OTHER',      label:'Other' },
];

export default function AddLinkModal({ thread, isGiver, hasLink, myWorkspace, onClose, onSaved }: {
  thread: Thread; isGiver: boolean; hasLink: boolean; myWorkspace: any;
  onClose: () => void; onSaved: () => void;
}) {
  const lp = thread.linkPlacement;
  const canEdit = !hasLink || isGiver;
  
  // If no link exists, whoever opens the modal acts as the giver for this submission.
  const sourceDomain = hasLink ? thread.giverWorkspace.domain : myWorkspace.domain;
  const targetDomain = hasLink 
    ? thread.receiverWorkspace.domain 
    : (thread.giverWorkspace.id === myWorkspace.id ? thread.receiverWorkspace.domain : thread.giverWorkspace.domain);
  const [sourceUrl, setSourceUrl] = useState(lp?.sourceUrl || `https://${sourceDomain}/`);
  const [targetUrl, setTargetUrl] = useState(lp?.targetUrl || `https://${targetDomain}/`);
  const [anchorText, setAnchorText] = useState(lp?.anchorText || '');
  const [linkType, setLinkType] = useState(lp?.linkType || 'GUEST_POST');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { setError('Only the user who placed the link can edit it.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/api/links', { threadId: thread.id, sourceUrl, targetUrl, anchorText, linkType });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save link details');
    } finally { setLoading(false); }
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" style={{ padding:28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link2 size={18} color="var(--accent)" />
            <h3>Link Placement Details</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        {!canEdit && (
          <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.875rem', color:'var(--amber)', display:'flex', gap:8, alignItems:'flex-start' }}>
            <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
            <span>The user who placed the link must fill in the technical details. You can view but not edit.</span>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:'0.875rem', color:'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="input-group">
            <label className="input-label">
              From URL <span style={{ color:'var(--text-muted)' }}>(must be on {sourceDomain})</span>
            </label>
            <input id="link-source" type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
              className="input-field" placeholder={`https://${sourceDomain}/blog/post`}
              disabled={!canEdit} required />
          </div>

          <div className="input-group">
            <label className="input-label">
              To URL <span style={{ color:'var(--text-muted)' }}>(targeting {targetDomain})</span>
            </label>
            <input id="link-target" type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
              className="input-field" placeholder={`https://${targetDomain}/`}
              disabled={!canEdit} required />
          </div>

          <div className="input-group">
            <label className="input-label">Anchor Text</label>
            <input id="link-anchor" type="text" value={anchorText} onChange={e => setAnchorText(e.target.value)}
              className="input-field" placeholder="e.g. best project management tools"
              disabled={!canEdit} required />
          </div>

          <div className="input-group">
            <label className="input-label">Link Type</label>
            <select id="link-type" value={linkType} onChange={e => setLinkType(e.target.value)}
              className="input-field" disabled={!canEdit} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
              {LINK_TYPES.map(lt => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex:1, justifyContent:'center' }}>
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button id="save-link-btn" type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={loading}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                {loading ? 'Saving…' : lp ? 'Update Link' : 'Save & Mark Placed'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
