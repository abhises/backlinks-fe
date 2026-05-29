'use client';
import { useState } from 'react';
import { X, Link2, Loader2, AlertCircle, ExternalLink, Pencil, Trash2 } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(!hasLink);

  const linkTypeLabel = LINK_TYPES.find(lt => lt.value === (lp?.linkType || linkType))?.label || 'Guest Post';

  const handleClear = async () => {
    if (!isGiver) return;
    try {
      await api.delete(`/api/links/${thread.id}`);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to clear link details');
    }
  };

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

  // ── Read-only summary view (shown when link already saved) ──────────────────
  if (hasLink && lp && !isEditing) {
    return (
      <div style={{ margin: '24px auto 0 auto', maxWidth: '700px', width: '100%', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-base)', overflow: 'hidden', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link2 size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LINK DETAILS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isGiver && (
              <>
                <button onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Edit
                </button>
                <button onClick={handleClear}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary rows */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'FROM', value: lp.sourceUrl, isUrl: true },
            { label: 'TO',   value: lp.targetUrl, isUrl: true },
            { label: 'ANCHOR', value: `"${lp.anchorText}"`, isUrl: false },
          ].map(({ label, value, isUrl }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ minWidth: 60, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', paddingTop: 2 }}>{label}</span>
              {isUrl ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', wordBreak: 'break-all' }}>
                  {value}
                  <ExternalLink size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                </a>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>{value}</span>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ minWidth: 60, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>TYPE</span>
            <span style={{
              fontSize: '0.78rem', fontWeight: 600,
              background: '#e0f2fe', color: '#0284c7',
              padding: '3px 10px', borderRadius: '12px'
            }}>{linkTypeLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit / Add form view ─────────────────────────────────────────────────────
  return (
    <div style={{ margin: '24px auto 0 auto', maxWidth: '700px', width: '100%', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-base)', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LINK DETAILS</span>
        </div>
        <button onClick={hasLink ? () => setIsEditing(false) : onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={16} /></button>
      </div>

      {!canEdit && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--amber)', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(245,158,11,0.05)' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>The user who placed the link must fill in the technical details. You can view but not edit.</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--red)', background: 'rgba(239,68,68,0.05)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            FROM URL <span style={{ textTransform: 'none', fontWeight: 500 }}>(on {sourceDomain})</span>
          </label>
          <input id="link-source" type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder={`https://${sourceDomain}/the-page`}
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            TO URL <span style={{ textTransform: 'none', fontWeight: 500 }}>(on {targetDomain})</span>
          </label>
          <input id="link-target" type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder={`https://${targetDomain}/target-page`}
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            ANCHOR TEXT
          </label>
          <input id="link-anchor" type="text" value={anchorText} onChange={e => setAnchorText(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder="e.g. minimalist travel packing"
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            LINK TYPE
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LINK_TYPES.map(lt => {
              const selected = linkType === lt.value;
              return (
                <button
                  key={lt.value}
                  type="button"
                  onClick={() => canEdit && setLinkType(lt.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selected ? '#1a1a1a' : 'var(--bg-surface)',
                    color: selected ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {lt.label}
                  <AlertCircle size={12} style={{ opacity: 0.5 }} />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {canEdit && (
            <button id="save-link-btn" type="submit"
              style={{
                background: '#1a1a1a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <span style={{ fontSize: '1rem', lineHeight: 1 }}>✓</span>}
              {loading ? 'Saving…' : 'Save details'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
