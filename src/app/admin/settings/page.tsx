'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, Settings2, Clock, Check, Save, Sliders, Users, Hourglass } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 0 * * 1');
  const [matchAmount, setMatchAmount] = useState(2);
  const [rejectLimit, setRejectLimit] = useState(5);
  const [answerTimeoutDays, setAnswerTimeoutDays] = useState(7);
  const [placementTimeoutDays, setPlacementTimeoutDays] = useState(30);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/admin/settings');
      if (res.data.settings) {
        setCronExpression(res.data.settings.cronExpression);
        setMatchAmount(res.data.settings.matchAmount);
        if (res.data.settings.rejectLimit !== undefined) {
          setRejectLimit(res.data.settings.rejectLimit);
        }
        if (res.data.settings.answerTimeoutDays !== undefined) {
          setAnswerTimeoutDays(res.data.settings.answerTimeoutDays);
        }
        if (res.data.settings.placementTimeoutDays !== undefined) {
          setPlacementTimeoutDays(res.data.settings.placementTimeoutDays);
        }
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/admin/settings', { 
        cronExpression, 
        matchAmount: Number(matchAmount), 
        rejectLimit: Number(rejectLimit),
        answerTimeoutDays: Number(answerTimeoutDays),
        placementTimeoutDays: Number(placementTimeoutDays)
      });
      setToastMessage({ type: 'success', text: 'Settings saved. Matcher CRON updated.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/api/admin/trigger-matching');
      setToastMessage({ type: 'success', text: 'Matchmaking triggered successfully.' });
      setShowModal(false);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: 'Failed to trigger match.' });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="settings-layout">
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 80, right: 40, zIndex: 9999,
          background: toastMessage.type === 'success' ? 'var(--green)' : 'var(--red)',
          color: 'white', padding: '12px 24px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.875rem', fontWeight: 600, animation: 'slideIn 0.3s ease-out forwards'
        }}>
          <Check size={16} />
          {toastMessage.text}
        </div>
      )}

      {/* Settings Sub-Sidebar Navigation */}
      <aside className="settings-sidebar">
        <h2>Admin Settings</h2>
        {[
          { label: 'Matchmaking Schedule', id: 'schedule', icon: Clock },
          { label: 'User Limits', id: 'limits', icon: Users },
          { label: 'Timeout Configs', id: 'timeouts', icon: Hourglass },
          { label: 'Manual Trigger', id: 'manual-trigger', icon: Sliders }
        ].map(s => (
          <a key={s.id} href={`#${s.id}`} className="settings-nav-item" style={{ color: 'var(--text-secondary)' }}>
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>Configure automated system behaviors and matchmaking logic.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            
            {/* 1. Matchmaking Schedule */}
            <section id="schedule">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Clock size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Matchmaking Schedule</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Matchmaking Frequency</label>
                  <select 
                    value={cronExpression} 
                    onChange={e => setCronExpression(e.target.value)} 
                    className="input-field" 
                    required 
                  >
                    <option value="*/10 * * * *">Every 10 Minutes (For Testing)</option>
                    <option value="0 * * * *">Every Hour</option>
                    <option value="0 0 * * *">Every Day at Midnight</option>
                    <option value="0 0 * * 1">Every Week (Monday at Midnight)</option>
                    <option value="0 0 1 * *">Every Month (1st of the month)</option>
                    <option value={cronExpression} hidden>Custom Schedule</option>
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Select how often the system should automatically pair users together.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. User Limits */}
            <section id="limits">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Users size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>User Limits</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Matches Per User (Give/Receive)</label>
                  <input 
                    type="number" 
                    value={matchAmount} 
                    onChange={e => setMatchAmount(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    max={10} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    The number of giving and receiving matches each user will receive per run. (e.g. 2 means 2 giving, 2 receiving).
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Maximum Allowed Rejections</label>
                  <input 
                    type="number" 
                    value={rejectLimit} 
                    onChange={e => setRejectLimit(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    max={100} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    The maximum number of connections a user is allowed to reject. Once reached, they can no longer reject new connections.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Timeout Configs */}
            <section id="timeouts">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Hourglass size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Timeout Configurations</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Answer Timeout (Days)</label>
                  <input 
                    type="number" 
                    value={answerTimeoutDays} 
                    onChange={e => setAnswerTimeoutDays(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Number of days a user has to accept or reject a match before it expires.
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Link Placement Timeout (Days)</label>
                  <input 
                    type="number" 
                    value={placementTimeoutDays} 
                    onChange={e => setPlacementTimeoutDays(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Number of days a user has to add the link details after accepting a match.
                  </p>
                </div>
              </div>
            </section>

            <div style={{ display: 'flex', gap: 12, marginTop: 8, maxWidth: 600 }}>
              <button type="submit" 
                className="btn btn-primary"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, 
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 
                }} 
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            {/* 4. Manual Trigger */}
            <section id="manual-trigger" style={{ marginTop: 24 }}>
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Sliders size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Manual Trigger</h2>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 'var(--radius)', maxWidth: 600 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>Force Matchmaking Now</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Manually trigger the matchmaking algorithm to run immediately outside of the scheduled CRON.</p>
                <button type="button" onClick={() => setShowModal(true)} className="btn btn-secondary">
                  <Settings2 size={16} />
                  Force Run Matchmaking Now
                </button>
              </div>
            </section>
          </form>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: 32, borderRadius: 'var(--radius-lg)', maxWidth: 450, width: '90%',
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
            animation: 'modalIn 0.2s ease-out'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Confirm Manual Run</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 24 }}>
              Are you sure you want to trigger the matchmaking algorithm right now? This will immediately scan all workspaces and dispatch new \`NEW\` backlink connections to users based on your Match Amount settings.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn btn-secondary"
                disabled={triggering}
              >
                Cancel
              </button>
              <button 
                onClick={confirmTrigger} 
                style={{ 
                  background: '#1a1a1a', color: '#ffffff', border: 'none', 
                  borderRadius: '6px', padding: '8px 16px', fontWeight: 600, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: 8, 
                  cursor: triggering ? 'not-allowed' : 'pointer', opacity: triggering ? 0.7 : 1 
                }}
                disabled={triggering}
              >
                {triggering ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
                {triggering ? 'Running...' : 'Run Algorithm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
