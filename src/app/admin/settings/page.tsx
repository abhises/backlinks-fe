'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2, Settings2, Clock, Check, Save, Sliders, Users, Hourglass, Rocket } from 'lucide-react';

export default function AdminSettings() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 0 * * 1');
  const [matchAmount, setMatchAmount] = useState(2);
  const [rejectLimit, setRejectLimit] = useState(5);
  const [answerTimeoutDays, setAnswerTimeoutDays] = useState(7);
  const [placementTimeoutDays, setPlacementTimeoutDays] = useState(30);
  const [platformMode, setPlatformMode] = useState<'BETA' | 'PAID'>('BETA');
  const [pendingMode, setPendingMode] = useState<'BETA' | 'PAID' | null>(null);
  const [switchingMode, setSwitchingMode] = useState(false);
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
        if (res.data.settings.platformMode) {
          setPlatformMode(res.data.settings.platformMode);
        }
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: t('adminSettings.failedLoad') });
    } finally {
      setLoading(false);
    }
  };

  const confirmSwitchMode = async () => {
    if (!pendingMode) return;
    setSwitchingMode(true);
    try {
      await api.put('/api/admin/settings', { platformMode: pendingMode });
      setPlatformMode(pendingMode);
      setToastMessage({ type: 'success', text: t('adminSettings.modeSwitched') });
      setPendingMode(null);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || t('adminSettings.failedSave') });
    } finally {
      setSwitchingMode(false);
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
      setToastMessage({ type: 'success', text: t('adminSettings.saved') });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err?.response?.data?.error || t('adminSettings.failedSave') });
    } finally {
      setSaving(false);
    }
  };

  const confirmTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/api/admin/trigger-matching');
      setToastMessage({ type: 'success', text: t('adminSettings.triggered') });
      setShowModal(false);
    } catch (err: any) {
      setToastMessage({ type: 'error', text: t('adminSettings.failedTrigger') });
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
        <h2>{t('adminSettings.title')}</h2>
        {[
          { label: t('adminSettings.hMode'), id: 'platform-mode', icon: Rocket },
          { label: t('adminSettings.hSchedule'), id: 'schedule', icon: Clock },
          { label: t('adminSettings.hLimits'), id: 'limits', icon: Users },
          { label: t('adminSettings.hTimeouts'), id: 'timeouts', icon: Hourglass },
          { label: t('adminSettings.hManual'), id: 'manual-trigger', icon: Sliders }
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('adminSettings.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{t('adminSettings.sub')}</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <>
          {/* 0. Platform Mode */}
          <section id="platform-mode" style={{ marginBottom: 48 }}>
            <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Rocket size={18} color="var(--accent)" />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminSettings.hMode')}</h2>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 600 }}>
              {t('adminSettings.modeDesc')}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 600 }}>
              <button
                type="button"
                onClick={() => platformMode !== 'BETA' && setPendingMode('BETA')}
                style={{
                  flex: 1, minWidth: 220, textAlign: 'left', padding: 20, borderRadius: 'var(--radius)', cursor: platformMode === 'BETA' ? 'default' : 'pointer',
                  border: platformMode === 'BETA' ? '2px solid #a855f7' : '1px solid var(--border)',
                  background: platformMode === 'BETA' ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t('adminSettings.modeBeta')}</span>
                  {platformMode === 'BETA' && <Check size={14} color="#a855f7" style={{ marginLeft: 'auto' }} />}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('adminSettings.modeBetaDesc')}</p>
              </button>

              <button
                type="button"
                onClick={() => platformMode !== 'PAID' && setPendingMode('PAID')}
                style={{
                  flex: 1, minWidth: 220, textAlign: 'left', padding: 20, borderRadius: 'var(--radius)', cursor: platformMode === 'PAID' ? 'default' : 'pointer',
                  border: platformMode === 'PAID' ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: platformMode === 'PAID' ? 'rgba(0, 184, 153, 0.08)' : 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t('adminSettings.modePaid')}</span>
                  {platformMode === 'PAID' && <Check size={14} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('adminSettings.modePaidDesc')}</p>
              </button>
            </div>
          </section>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* 1. Matchmaking Schedule */}
            <section id="schedule">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Clock size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminSettings.hSchedule')}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>{t('adminSettings.scheduleLabel')}</label>
                  <select 
                    value={cronExpression} 
                    onChange={e => setCronExpression(e.target.value)} 
                    className="input-field" 
                    required 
                  >
                    <option value="*/10 * * * *">{t('adminSettings.optEvery10')}</option>
                    <option value="0 * * * *">{t('adminSettings.optEveryHour')}</option>
                    <option value="0 0 * * *">{t('adminSettings.optEveryDay')}</option>
                    <option value="0 0 * * 1">{t('adminSettings.optEveryWeek')}</option>
                    <option value="0 0 1 * *">{t('adminSettings.optEveryMonth')}</option>
                    <option value={cronExpression} hidden>{t('adminSettings.optCustom')}</option>
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {t('adminSettings.scheduleDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. User Limits */}
            <section id="limits">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Users size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminSettings.hLimits')}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>{t('adminSettings.limitsMatchLabel')}</label>
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
                    {t('adminSettings.limitsMatchDesc')}
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>{t('adminSettings.limitsRejectLabel')}</label>
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
                    {t('adminSettings.limitsRejectDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Timeout Configs */}
            <section id="timeouts">
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Hourglass size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminSettings.hTimeouts')}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>{t('adminSettings.timeoutAnswerLabel')}</label>
                  <input 
                    type="number" 
                    value={answerTimeoutDays} 
                    onChange={e => setAnswerTimeoutDays(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {t('adminSettings.timeoutAnswerDesc')}
                  </p>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>{t('adminSettings.timeoutPlacementLabel')}</label>
                  <input 
                    type="number" 
                    value={placementTimeoutDays} 
                    onChange={e => setPlacementTimeoutDays(Number(e.target.value))} 
                    className="input-field" 
                    min={1} 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    {t('adminSettings.timeoutPlacementDesc')}
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
                {saving ? t('adminSettings.saving') : t('adminSettings.save')}
              </button>
            </div>

            {/* 4. Manual Trigger */}
            <section id="manual-trigger" style={{ marginTop: 24 }}>
              <div style={{ position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 5, padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Sliders size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t('adminSettings.hManual')}</h2>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 'var(--radius)', maxWidth: 600 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 6 }}>{t('adminSettings.manualSub')}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{t('adminSettings.manualDesc')}</p>
                <button type="button" onClick={() => setShowModal(true)} className="btn btn-secondary">
                  <Settings2 size={16} />
                  {t('adminSettings.forceBtn')}
                </button>
              </div>
            </section>
          </form>
          </>
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{t('adminSettings.confirmModalTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 24 }}>
              {t('adminSettings.confirmModalDesc')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn btn-secondary"
                disabled={triggering}
              >
                {t('app.cancel')}
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
                {triggering ? t('adminSettings.running') : t('adminSettings.runBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: 32, borderRadius: 'var(--radius-lg)', maxWidth: 450, width: '90%',
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
            animation: 'modalIn 0.2s ease-out'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{t('adminSettings.modeConfirmTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 24 }}>
              {pendingMode === 'PAID' ? t('adminSettings.modeConfirmToPaid') : t('adminSettings.modeConfirmToBeta')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setPendingMode(null)}
                className="btn btn-secondary"
                disabled={switchingMode}
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={confirmSwitchMode}
                style={{
                  background: '#1a1a1a', color: '#ffffff', border: 'none',
                  borderRadius: '6px', padding: '8px 16px', fontWeight: 600, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: switchingMode ? 'not-allowed' : 'pointer', opacity: switchingMode ? 0.7 : 1
                }}
                disabled={switchingMode}
              >
                {switchingMode ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {switchingMode ? t('adminSettings.switching') : t('adminSettings.confirmSwitch')}
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
