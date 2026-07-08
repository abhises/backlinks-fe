'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  Globe, User, Gift, Bell, CreditCard, 
  HelpCircle, AlertTriangle, Check, Copy, 
  Mail, Shield, ArrowRight, HelpCircle as HelpIcon, Plus, Loader2, Sun, Moon
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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

export default function SettingsPage() {
  const { t } = useLanguage();
  const { workspace, user, setWorkspace } = useAuth();
  
  const FAQS = [
    { q: t('settings.faq1Q'), a: t('settings.faq1A') },
    { q: t('settings.faq2Q'), a: t('settings.faq2A') },
    { q: t('settings.faq3Q'), a: t('settings.faq3A') }
  ];
  
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
      setSaveError(err.response?.data?.error || t('settings.failedUpdate'));
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

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    let saved = localStorage.getItem('bl_theme');
    if (saved === 'color') saved = 'dark';
    setTheme((saved as 'light' | 'dark') || 'dark');
  }, []);

  const changeTheme = (t: 'light' | 'dark') => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('bl_theme', t);
  };

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
        <h2>{t('settings.title')}</h2>
        {[
          { label: t('settings.navProfile'), id: 'website-profile', icon: Globe },
          { label: t('settings.navAccount'), id: 'account', icon: User },
          { label: t('settings.navInvite'), id: 'invite', icon: Gift },
          { label: t('settings.navNotifications'), id: 'notifications', icon: Bell },
          { label: t('settings.navBilling'), id: 'billing', icon: CreditCard },
          { label: t('settings.navHelp'), id: 'help', icon: HelpCircle },
          { label: t('settings.navDanger'), id: 'danger', icon: AlertTriangle, color: 'var(--red)' }
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
          .settings-content .btn:not(.btn-outline) {
            background: #1a1a1a !important;
            color: #fff !important;
            border: 1px solid #1a1a1a !important;
            box-shadow: none !important;
          }
          .settings-content .btn:not(.btn-outline):hover {
            background: #000 !important;
            border-color: #000 !important;
          }
          .settings-content .btn-outline {
            background: transparent !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border) !important;
          }
          .settings-content .btn-outline:hover {
            background: var(--bg-hover) !important;
          }
        `}</style>
        
        {/* Header */}
        <div style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('settings.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{t('settings.subtitle')}</p>
        </div>

        {/* 1. Website Profile */}
        <section id="website-profile" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Globe size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hProfile')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <div className="input-group">
              <label className="input-label">{t('settings.websiteName')}</label>
              <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="input-field" placeholder="My SEO Site" />
            </div>
            <div className="input-group">
              <label className="input-label">{t('settings.websiteUrl')}</label>
              <input type="text" value={siteDomain} onChange={e => setSiteDomain(e.target.value)} className="input-field" placeholder="example.com" />
            </div>
            <div className="input-group">
              <label className="input-label">{t('settings.profileCategory')}</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field" style={{ height: 38 }}>
                <option value="Tech & Software">{t('settings.catTech')}</option>
                <option value="Health & Medical">{t('settings.catHealth')}</option>
                <option value="Business & Finance">{t('settings.catBusiness')}</option>
                <option value="Travel & Leisure">{t('settings.catTravel')}</option>
                <option value="Other">{t('settings.catOther')}</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">{t('settings.profileDescLabel')}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field" style={{ height: 90, padding: '10px 12px', resize: 'vertical' }} placeholder={t('settings.profileDescPlaceholder')} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveWebsite}
                disabled={saveLoading}
                style={{ width: 'fit-content' }}
              >
                {saveLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {saveLoading ? t('settings.saving') : t('settings.saveChanges')}
              </button>
              {saveSuccess && (
                <span style={{ color: 'var(--green)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  ✓ {t('settings.success')}
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hAccount')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
            <div className="input-group">
              <label className="input-label">{t('settings.yourName')}</label>
              <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="input-field" placeholder="Full Name" />
            </div>
            <div className="input-group">
              <label className="input-label">{t('settings.emailAddress')}</label>
              <input type="email" value={accountEmail} onChange={e => setAccountEmail(e.target.value)} className="input-field" placeholder="email@example.com" />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>{t('settings.appearance')}</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => changeTheme('light')}
                  className={`btn ${theme === 'light' ? 'btn-outline' : 'btn-primary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}
                >
                  <Sun size={16} /> {t('settings.lightMode')}
                </button>
                <button
                  onClick={() => changeTheme('dark')}
                  className={`btn ${theme === 'dark' ? 'btn-outline' : 'btn-primary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}
                >
                  <Moon size={16} /> {t('settings.darkMode')}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>{t('settings.changePassword')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">{t('settings.newPassword')}</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('settings.confirmPassword')}</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 'fit-content', marginTop: 8 }}>{t('settings.updateProfile')}</button>
          </div>
        </section>



        {/* 4. Invite a Friend */}
        <section id="invite" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Gift size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hInvite')}</h2>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--border-subtle))', padding: '24px 32px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxWidth: 640 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>{t('settings.inviteTitle')}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              {t('settings.inviteDesc')}
            </p>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={referralLink} readOnly className="input-field" style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem' }} />
              <button onClick={copyReferral} className={`btn ${copiedRef ? 'btn-success' : 'btn-secondary'}`} style={{ minWidth: 100 }}>
                {copiedRef ? <Check size={15} /> : <Copy size={15} />}
                {copiedRef ? t('settings.copiedBtn') : t('settings.copyBtn')}
              </button>
            </div>
          </div>
        </section>

        {/* 5. Notifications */}
        <section id="notifications" style={{ marginBottom: 48 }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Bell size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hNotifications')}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: t('settings.notifConnTitle'), desc: t('settings.notifConnDesc'), val: notifNewRequest, set: setNotifNewRequest },
              { title: t('settings.notifMsgTitle'), desc: t('settings.notifMsgDesc'), val: notifMessages, set: setNotifMessages },
              { title: t('settings.notifStatusTitle'), desc: t('settings.notifStatusDesc'), val: notifStatusUpdate, set: setNotifStatusUpdate }
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hBilling')}</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 30 }}>
            {/* Current Plan */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 24, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="pill pill-live" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('settings.activePlan')}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12 }}>{t('settings.planName')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{t('settings.planDesc')}</p>
              </div>
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>$29<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/mo</span></p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{t('settings.nextInvoice')}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 24, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('settings.paymentMethod')}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t('settings.cardInfo')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{t('settings.cardExpires')}</p>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content', marginTop: 20 }}>{t('settings.updateCard')}</button>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>{t('settings.invoices')}</h3>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-surface)', fontSize: '0.8125rem' }}>
            {[
              { id: 'INV-0912', date: 'May 15, 2026', amount: '$29.00', status: t('settings.paid') },
              { id: 'INV-0877', date: 'Apr 15, 2026', amount: '$29.00', status: t('settings.paid') }
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('settings.hHelp')}</h2>
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
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>{t('settings.stillNeedHelp')}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{t('settings.ticketDesc')}</p>
            <form onSubmit={handleSupportSubmit}>
              <textarea value={supportMsg} onChange={e => setSupportMsg(e.target.value)} className="input-field" style={{ height: 80, padding: '10px 12px', marginBottom: 12, fontSize: '0.8125rem' }} placeholder={t('settings.ticketPlaceholder')} required />
              <button type="submit" className="btn btn-secondary btn-sm">{t('settings.submitTicket')}</button>
            </form>
            {supportSuccess && (
              <p style={{ color: 'var(--green)', fontSize: '0.75rem', fontWeight: 600, marginTop: 10 }}>{t('settings.ticketSuccess')}</p>
            )}
          </div>
        </section>

        {/* 8. Danger Zone */}
        <section id="danger">
          <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--red)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--red)' }}>{t('settings.hDanger')}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(220, 38, 38, 0.05)', border: '1px dashed var(--red)', padding: 24, borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('settings.deleteWorkspace')}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.deleteWorkspaceDesc')}</p>
              </div>
              <button className="btn btn-danger btn-sm">{t('settings.deleteWorkspace')}</button>
            </div>
            
            <div style={{ borderTop: '1px solid rgba(220, 38, 38, 0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{t('settings.deleteAccount')}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.deleteAccountDesc')}</p>
              </div>
              <button className="btn btn-danger btn-sm">{t('settings.deleteAccount')}</button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
