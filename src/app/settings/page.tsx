'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  Globe, User, Users, Gift, Bell, CreditCard, 
  HelpCircle, AlertTriangle, Check, Copy, UserPlus, 
  Mail, Shield, ArrowRight, HelpCircle as HelpIcon, Plus, Loader2
} from 'lucide-react';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  avatar: string;
};

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@serpsupport.com', role: 'OWNER', avatar: 'AJ' },
  { id: '2', name: 'Sarah Miller', email: 'sarah@serpsupport.com', role: 'EDITOR', avatar: 'SM' },
  { id: '3', name: 'David Lee', email: 'david@serpsupport.com', role: 'VIEWER', avatar: 'DL' },
];

const FAQS = [
  { q: 'How does backlink exchange work?', a: 'You submit backlink requests with other website owners in the directory. Once accepted, you agree on who gives a link and who receives one, fill in placement details, and place the links. We check status dynamically.' },
  { q: 'Is it safe for SEO?', a: 'Yes, because SERPsupport focuses on high-quality, relevant niche edits and guest posts. We recommend natural anchor text and keeping placements highly contextually relevant.' },
  { q: 'Can I add multiple websites?', a: 'Currently each workspace is tied to one primary domain. You can create or switch workspaces to manage multiple websites.' }
];

export default function SettingsPage() {
  const { workspace, user, setWorkspace } = useAuth();
  
  // Website profile state
  const [siteName, setSiteName] = useState(workspace?.websiteName || '');
  const [siteDomain, setSiteDomain] = useState(workspace?.domain || '');
  const [category, setCategory] = useState(workspace?.niche || 'Tech & Software');
  const [description, setDescription] = useState(workspace?.description || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setSiteName(workspace.websiteName || '');
      setSiteDomain(workspace.domain || '');
      if (workspace.niche) setCategory(workspace.niche);
      setDescription(workspace.description || '');
    }
  }, [workspace]);

  const handleSaveWebsite = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await api.patch('/api/workspaces/mine', {
        domain: siteDomain,
        websiteName: siteName,
        description,
        niche: category
      });
      setWorkspace(res.data.workspace);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.error || 'Failed to update website profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Account state
  const [accountName, setAccountName] = useState(user?.name || 'Jane Doe');
  const [accountEmail, setAccountEmail] = useState(user?.email || 'jane@example.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Team state
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');

  // Referral state
  const [referralLink] = useState('https://app.serpsupport.com/register?ref=jane778');
  const [copiedRef, setCopiedRef] = useState(false);

  // Notification state
  const [notifNewRequest, setNotifNewRequest] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifStatusUpdate, setNotifStatusUpdate] = useState(true);

  // Help support ticket state
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Copy referral utility
  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Add team member utility
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: inviteEmail.substring(0, 2).toUpperCase()
    };
    setTeam(prev => [...prev, newMember]);
    setInviteEmail('');
  };

  // Remove team member utility
  const handleRemoveMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  // Change member role
  const handleChangeRole = (id: string, role: 'OWNER' | 'EDITOR' | 'VIEWER') => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  // Submit help ticket
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setSupportSuccess(true);
    setSupportMsg('');
    setTimeout(() => setSupportSuccess(false), 3000);
  };

  return (
    <div className="settings-layout">
      {/* Settings Sub-Sidebar Navigation */}
      <aside className="settings-sidebar">
        <h2>Settings</h2>
        {[
          { label: 'Website Profile', id: 'website-profile', icon: Globe },
          { label: 'Account', id: 'account', icon: User },
          { label: 'Team Members', id: 'team', icon: Users },
          { label: 'Invite a Friend', id: 'invite', icon: Gift },
          { label: 'Notifications', id: 'notifications', icon: Bell },
          { label: 'Billing & Plans', id: 'billing', icon: CreditCard },
          { label: 'Help & FAQ', id: 'help', icon: HelpCircle },
          { label: 'Danger Zone', id: 'danger', icon: AlertTriangle, color: 'var(--red)' }
        ].map(s => (
          <a key={s.id} href={`#${s.id}`} className="settings-nav-item" style={{ color: s.color || 'var(--text-secondary)' }}>
            <s.icon size={16} />
            {s.label}
          </a>
        ))}
      </aside>

      {/* Settings Sections Area */}
      <div className="settings-content">
        <style>{`
          .settings-content .btn {
            background: #1a1a1a !important;
            color: #fff !important;
            border: 1px solid #1a1a1a !important;
            box-shadow: none !important;
          }
          .settings-content .btn:hover {
            background: #000 !important;
            border-color: #000 !important;
          }
        `}</style>
        
        {/* Header */}
        <div style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Workspace Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>Configure website specs, permissions, billing, and team collaboration options.</p>
        </div>

        {/* 1. Website Profile */}
        <section id="website-profile" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Globe size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Website Profile</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <div className="input-group">
              <label className="input-label">Website Name</label>
              <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="input-field" placeholder="My SEO Site" />
            </div>
            <div className="input-group">
              <label className="input-label">Primary Domain</label>
              <input type="text" value={siteDomain} onChange={e => setSiteDomain(e.target.value)} className="input-field" placeholder="example.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Category / Niche</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field" style={{ height: 38 }}>
                <option value="Tech & Software">Tech & Software</option>
                <option value="Health & Medical">Health & Medical</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Travel & Leisure">Travel & Leisure</option>
                <option value="Other">Other Category</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Description (for directory discovery)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" style={{ height: 90, padding: '10px 12px', resize: 'vertical' }} placeholder="Tell other partners what your site is about..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveWebsite}
                disabled={saveLoading}
                style={{ width: 'fit-content' }}
              >
                {saveLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Website Changes
              </button>
              {saveSuccess && (
                <span style={{ color: 'var(--green)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  ✓ Website profile updated!
                </span>
              )}
              {saveError && (
                <span style={{ color: 'var(--red)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  ⚠️ {saveError}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 2. Account */}
        <section id="account" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <User size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Account Details</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="input-field" placeholder="Full Name" />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input type="email" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} className="input-field" placeholder="email@example.com" />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 'fit-content', marginTop: 8 }}>Update Profile</button>
          </div>
        </section>

        {/* 3. Team */}
        <section id="team" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Users size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Team Management</h2>
          </div>
          
          {/* Invite form */}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input-field" style={{ height: 38 }} placeholder="colleague@domain.com" required />
            </div>
            <div>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="input-field" style={{ height: 38, width: 120 }}>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={15} /> Invite Member
            </button>
          </form>

          {/* Members Table */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
            {team.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {m.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {m.role === 'OWNER' ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingRight: 10 }}>Owner</span>
                  ) : (
                    <>
                      <select value={m.role} onChange={e => handleChangeRole(m.id, e.target.value as any)} className="input-field" style={{ height: 30, width: 100, fontSize: '0.75rem', padding: '2px 6px' }}>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button onClick={() => handleRemoveMember(m.id)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Invite a Friend */}
        <section id="invite" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Gift size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Invite a Friend</h2>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--border-subtle))', padding: '24px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxWidth: 640 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Get 3 Months Free</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Share your referral link with other website owners. When they place their first backlink through SERPsupport, you both get 3 months of premium features for free.
            </p>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={referralLink} readOnly className="input-field" style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem' }} />
              <button onClick={copyReferral} className={`btn ${copiedRef ? 'btn-success' : 'btn-secondary'}`} style={{ minWidth: 100 }}>
                {copiedRef ? <Check size={15} /> : <Copy size={15} />}
                {copiedRef ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </section>

        {/* 5. Notifications */}
        <section id="notifications" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Bell size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Notifications</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: 'New connection requests', desc: 'Email me when another workspace invites me to place backlinks.', val: notifNewRequest, set: setNotifNewRequest },
              { title: 'New chat messages', desc: 'Notify me when I receive messages in active coordinate threads.', val: notifMessages, set: setNotifMessages },
              { title: 'Backlink status alerts', desc: 'Get instant alerts when a live backlink drops or changes status.', val: notifStatusUpdate, set: setNotifStatusUpdate }
            ].map((n, idx) => (
              <label key={idx} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', selectText: 'none' } as any}>
                <input type="checkbox" checked={n.val} onChange={e => n.set(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--accent)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* 6. Billing */}
        <section id="billing" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CreditCard size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Billing & Plans</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 30 }}>
            {/* Current Plan */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 24, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="pill pill-live" style={{ fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE PLAN</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12 }}>Growth SEO</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>Ideal for growing sites managing up to 30 backlinks.</p>
              </div>
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>$29<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/mo</span></p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Next invoice: June 15, 2026</p>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 24, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>PAYMENT METHOD</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  💳 Visa ending in 4242
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>Expires 12/2028</p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content', marginTop: 20 }}>Update Card</button>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Invoices</h3>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-surface)', fontSize: '0.8125rem' }}>
            {[
              { id: 'INV-0912', date: 'May 15, 2026', amount: '$29.00', status: 'Paid' },
              { id: 'INV-0877', date: 'Apr 15, 2026', amount: '$29.00', status: 'Paid' }
            ].map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{inv.id}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>{inv.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>{inv.amount}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Help & FAQ */}
        <section id="help" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <HelpCircle size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Help & FAQ</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
            {FAQS.map((faq, idx) => (
              <details key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', cursor: 'pointer' }}>
                <summary style={{ fontWeight: 600, fontSize: '0.875rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {faq.q}
                  <Plus size={14} style={{ color: 'var(--text-muted)' }} />
                </summary>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, cursor: 'default' }}>{faq.a}</p>
              </details>
            ))}
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 'var(--radius)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>Still need help?</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Submit a support ticket and our team will get back to you within 24 hours.</p>
            <form onSubmit={handleSupportSubmit}>
              <textarea value={supportMsg} onChange={e => setSupportMsg(e.target.value)} className="input-field" style={{ height: 80, padding: '10px 12px', marginBottom: 12, fontSize: '0.8125rem' }} placeholder="Explain what went wrong or ask a question..." required />
              <button type="submit" className="btn btn-secondary btn-sm">Submit Ticket</button>
            </form>
            {supportSuccess && (
              <p style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600, marginTop: 10 }}>Ticket submitted successfully!</p>
            )}
          </div>
        </section>

        {/* 8. Danger Zone */}
        <section id="danger">
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--red)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--red)' }}>Danger Zone</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(220, 38, 38, 0.05)', border: '1px dashed var(--red)', padding: 24, borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Delete Workspace</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Permanently delete this website workspace and all of its backlink threads.</p>
              </div>
              <button className="btn btn-danger btn-sm">Delete Workspace</button>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(220, 38, 38, 0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Delete Account</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Delete your personal profile. Workspaces you created will be orphaned.</p>
              </div>
              <button className="btn btn-danger btn-sm">Delete Account</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
