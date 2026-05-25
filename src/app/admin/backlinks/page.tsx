'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, Link2, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';

type BacklinkData = {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: string;
  status: string;
  datePlaced: string;
  giverWorkspace: {
    domain: string;
  };
  receiverWorkspace: {
    domain: string;
  };
};

export default function AdminBacklinks() {
  const [backlinks, setBacklinks] = useState<BacklinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ sourceUrl: '', targetUrl: '', anchorText: '', linkType: '', status: '' });
  const [saving, setSaving] = useState(false);

  // Modal and Toast state
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBacklinks();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchBacklinks = async () => {
    try {
      const res = await api.get('/api/admin/backlinks');
      setBacklinks(res.data.backlinks);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load backlinks');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (link: BacklinkData) => {
    setEditingId(link.id);
    setEditForm({ 
      sourceUrl: link.sourceUrl, 
      targetUrl: link.targetUrl, 
      anchorText: link.anchorText, 
      linkType: link.linkType, 
      status: link.status 
    });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await api.put(`/api/admin/backlinks/${id}`, editForm);
      setBacklinks(backlinks.map(l => l.id === id ? { ...l, ...res.data.backlink } : l));
      setEditingId(null);
      setToastMessage({ type: 'success', text: 'Backlink updated successfully' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to update backlink' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/backlinks/${deleteModalId}`);
      setBacklinks(backlinks.filter(l => l.id !== deleteModalId));
      setToastMessage({ type: 'success', text: 'Backlink deleted successfully' });
      setDeleteModalId(null);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete backlink' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '100%', position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 40,
          zIndex: 9999,
          background: toastMessage.type === 'success' ? 'var(--green)' : 'var(--red)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.875rem',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {toastMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toastMessage.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 400, padding: 32, background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: '50%' }}>
                <AlertTriangle color="var(--red)" size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Confirm Deletion</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to delete this backlink placement record? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--red)', color: 'white', border: 'none' }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete Backlink'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">Backlinks</h1>
          <p className="page-sub">View and manage all platform link placements.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 32, width: '100%', overflowX: 'auto' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : backlinks.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon" style={{ background: 'var(--bg-hover)' }}><Link2 color="var(--text-muted)" /></div>
            <h3>No backlinks found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Source Domain</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Target Domain</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Source URL</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Target URL</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Anchor Text</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Date Placed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backlinks.map(link => {
                  const isEditing = editingId === link.id;

                  return (
                    <tr key={link.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {link.giverWorkspace.domain}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {link.receiverWorkspace.domain}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input className="input-field" value={editForm.sourceUrl} onChange={e => setEditForm({...editForm, sourceUrl: e.target.value})} style={{ padding: '6px 10px', height: 32 }} />
                        ) : (
                          <a href={link.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }} title={link.sourceUrl}>
                            {link.sourceUrl.length > 20 ? link.sourceUrl.substring(0, 20) + '...' : link.sourceUrl}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input className="input-field" value={editForm.targetUrl} onChange={e => setEditForm({...editForm, targetUrl: e.target.value})} style={{ padding: '6px 10px', height: 32 }} />
                        ) : (
                          <a href={link.targetUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }} title={link.targetUrl}>
                            {link.targetUrl.length > 20 ? link.targetUrl.substring(0, 20) + '...' : link.targetUrl}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input className="input-field" value={editForm.anchorText} onChange={e => setEditForm({...editForm, anchorText: e.target.value})} style={{ padding: '6px 10px', height: 32 }} />
                        ) : link.anchorText}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {isEditing ? (
                          <select className="input-field" value={editForm.linkType} onChange={e => setEditForm({...editForm, linkType: e.target.value})} style={{ padding: '6px 10px', height: 32 }}>
                            <option value="GUEST_POST">GUEST POST</option>
                            <option value="NICHE_EDIT">NICHE EDIT</option>
                            <option value="IMAGE">IMAGE</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                            background: 'var(--bg-hover)', color: 'var(--text-secondary)'
                          }}>
                            {link.linkType.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {isEditing ? (
                          <select className="input-field" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ padding: '6px 10px', height: 32 }}>
                            <option value="LIVE">LIVE</option>
                            <option value="REMOVED">REMOVED</option>
                            <option value="DEPARTED">DEPARTED</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                            background: link.status === 'LIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: link.status === 'LIVE' ? 'var(--green)' : 'var(--red)'
                          }}>
                            {link.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {new Date(link.datePlaced).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(link.id)} disabled={saving} className="btn btn-primary btn-icon" style={{ width: 32, height: 32, padding: 0 }} title="Save">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32, padding: 0 }} title="Cancel">
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(link)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32, padding: 0 }} title="Edit">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => setDeleteModalId(link.id)} className="btn btn-ghost btn-icon" style={{ width: 32, height: 32, padding: 0, color: 'var(--red)' }} title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
