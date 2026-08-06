'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Link2, Loader2, AlertCircle, ExternalLink, Pencil, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '@/lib/api';

import { useLanguage } from '@/context/LanguageContext';

type Thread = {
  id: string;
  giverWorkspace: { id: string; domain: string };
  receiverWorkspace: { id: string; domain: string };
  linkPlacement?: any;
};

export default function AddLinkModal({ thread, isGiver, hasLink, myWorkspace, onClose, onSaved }: {
  thread: Thread; isGiver: boolean; hasLink: boolean; myWorkspace: any;
  onClose: () => void; onSaved: () => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const lp = thread.linkPlacement;
  const canEdit = !hasLink || isGiver;

  const LINK_TYPES = [
    { value:'GUEST_POST', label: t('linkModal.guestPost') },
    { value:'NICHE_EDIT', label: t('linkModal.nicheEdit') },
    { value:'IMAGE',      label: t('linkModal.imageLink') },
    { value:'OTHER',      label: t('linkModal.other') },
  ];

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

  const linkTypeLabel = LINK_TYPES.find(lt => lt.value === (lp?.linkType || linkType))?.label || t('linkModal.guestPost');

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
    if (!canEdit) { setError(t('linkModal.readOnlyDesc')); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/api/links', { threadId: thread.id, sourceUrl, targetUrl, anchorText, linkType });
      onSaved();
    } catch (err: any) {
      if (err?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        router.push('/billing');
        return;
      }
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('linkModal.title')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isGiver && (
              <>
                <button onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('linkModal.edit')}
                </button>
                <button onClick={handleClear}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>
                  {t('linkModal.clear')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary rows */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { 
              label: t('linkModal.from'), value: lp.sourceUrl, isUrl: true, 
              tag: (
                <div 
                  title={`${sourceDomain} gives a backlink to ${targetDomain}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', padding: '2px 6px', color: '#a855f7', background: '#f3e8ff', borderRadius: '4px', fontWeight: 700, cursor: 'help' }}
                >
                  <ArrowUpRight size={10} /> {t('linkModal.backlinkOut')}
                </div>
              )
            },
            { 
              label: t('linkModal.to'),   value: lp.targetUrl, isUrl: true, 
              tag: (
                <div 
                  title={`${sourceDomain} gives a backlink to ${targetDomain}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', padding: '2px 6px', color: '#0284c7', background: '#e0f2fe', borderRadius: '4px', fontWeight: 700, cursor: 'help' }}
                >
                  <ArrowDownLeft size={10} /> {t('linkModal.backlinkIn')}
                </div>
              )
            },
            { label: t('linkModal.anchor'), value: `"${lp.anchorText}"`, isUrl: false },
          ].map(({ label, value, isUrl, tag }: any) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ minWidth: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', paddingTop: 2 }}>{label}</span>
                {tag}
              </div>
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
            <div style={{ minWidth: 120 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{t('linkModal.type')}</span>
            </div>
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
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('linkModal.title')}</span>
        </div>
        <button onClick={hasLink ? () => setIsEditing(false) : onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={16} /></button>
      </div>

      {!canEdit && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--amber)', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(245,158,11,0.05)' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{t('linkModal.readOnlyDesc')}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--red)', background: 'rgba(239,68,68,0.05)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            <span>{t('linkModal.fromUrl')} <span style={{ textTransform: 'none', fontWeight: 500 }}>(on {sourceDomain})</span></span>
            <div 
              title={`${sourceDomain} gives a backlink to ${targetDomain}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', padding: '2px 8px', color: '#a855f7', background: '#f3e8ff', borderRadius: '4px', fontWeight: 700, cursor: 'help' }}
            >
              <ArrowUpRight size={12} /> {t('linkModal.backlinkOut')}
            </div>
          </label>
          <input id="link-source" type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder={`https://${sourceDomain}/the-page`}
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            <span>{t('linkModal.toUrl')} <span style={{ textTransform: 'none', fontWeight: 500 }}>(on {targetDomain})</span></span>
            <div 
              title={`${sourceDomain} gives a backlink to ${targetDomain}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', padding: '2px 8px', color: '#0284c7', background: '#e0f2fe', borderRadius: '4px', fontWeight: 700, cursor: 'help' }}
            >
              <ArrowDownLeft size={12} /> {t('linkModal.backlinkIn')}
            </div>
          </label>
          <input id="link-target" type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder={`https://${targetDomain}/target-page`}
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {t('linkModal.anchorText')}
          </label>
          <input id="link-anchor" type="text" value={anchorText} onChange={e => setAnchorText(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '0.875rem', outline: 'none', color: 'var(--text-primary)' }}
            placeholder="e.g. minimalist travel packing"
            disabled={!canEdit} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {t('linkModal.linkType')}
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
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={hasLink ? () => setIsEditing(false) : onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {t('linkModal.back')}
          </button>
          
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
              {loading ? t('linkModal.saving') : t('linkModal.save')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
