'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, User, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  teamMemberships: {
    workspace: {
      domain: string;
      websiteName: string;
    }
  }[];
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [saving, setSaving] = useState(false);

  // Modal and Toast state
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.users);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: UserData) => {
    if (user.role === 'ADMIN') return;
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await api.put(`/api/admin/users/${id}`, editForm);
      setUsers(users.map(u => u.id === id ? { ...u, ...res.data.user } : u));
      setEditingId(null);
      setToastMessage({ type: 'success', text: 'User updated successfully' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to update user' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${deleteModalId}`);
      setUsers(users.filter(u => u.id !== deleteModalId));
      setToastMessage({ type: 'success', text: 'User deleted successfully' });
      setDeleteModalId(null);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete user' });
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
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove their data from the platform.
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
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">Users</h1>
          <p className="page-sub">View and manage platform users.</p>
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
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0', border: 'none', background: 'transparent' }}>
            <div className="empty-state-icon" style={{ background: 'var(--bg-hover)' }}><User color="var(--text-muted)" /></div>
            <h3>No users found</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Workspace</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Joined</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isEditing = editingId === u.id;
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {isEditing ? (
                          <input className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ padding: '6px 10px', height: 32 }} />
                        ) : u.name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {isEditing ? (
                          <input className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ padding: '6px 10px', height: 32 }} />
                        ) : u.email}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                        {isEditing ? (
                          <select className="input-field" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ padding: '6px 10px', height: 32 }}>
                            <option value="CLIENT">CLIENT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                            background: isAdmin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: isAdmin ? 'var(--red)' : 'var(--blue)'
                          }}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.teamMemberships.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.teamMemberships[0].workspace.domain}</span>
                            <span style={{ fontSize: '0.75rem' }}>{u.teamMemberships[0].workspace.websiteName}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No workspace</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSave(u.id)} disabled={saving} className="btn btn-primary btn-icon" style={{ width: 32, height: 32, padding: 0 }} title="Save">
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32, padding: 0 }} title="Cancel">
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditClick(u)} 
                                className="btn btn-secondary btn-icon" 
                                style={{ width: 32, height: 32, padding: 0, opacity: isAdmin ? 0.3 : 1, cursor: isAdmin ? 'not-allowed' : 'pointer' }} 
                                disabled={isAdmin}
                                title={isAdmin ? "Cannot edit an Admin" : "Edit"}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => !isAdmin && setDeleteModalId(u.id)} 
                                className="btn btn-ghost btn-icon" 
                                style={{ width: 32, height: 32, padding: 0, color: 'var(--red)', opacity: isAdmin ? 0.3 : 1, cursor: isAdmin ? 'not-allowed' : 'pointer' }} 
                                disabled={isAdmin}
                                title={isAdmin ? "Cannot delete an Admin" : "Delete"}
                              >
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
