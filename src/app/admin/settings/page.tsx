'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, Settings2, Clock, Check, Save } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 0 * * 1');
  const [matchAmount, setMatchAmount] = useState(2);
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
      await api.put('/api/admin/settings', { cronExpression, matchAmount: Number(matchAmount) });
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
    <div style={{ padding: '32px 40px', position: 'relative' }}>
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

      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-sub">Configure automated system behaviors and matchmaking logic.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ background: 'var(--bg-hover)', padding: 10, borderRadius: 'var(--radius)' }}>
            <Clock size={20} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Matchmaking CRON Schedule</h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              
              <button type="button" onClick={() => setShowModal(true)} className="btn btn-secondary">
                <Settings2 size={16} />
                Force Run Matchmaking Now
              </button>
            </div>
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
              Are you sure you want to trigger the matchmaking algorithm right now? This will immediately scan all workspaces and dispatch new `NEW` backlink connections to users based on your Match Amount settings.
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
                className="btn btn-primary"
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
