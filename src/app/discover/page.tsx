'use client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Clock } from 'lucide-react';

export default function DiscoverPage() {
  const { workspace } = useAuth();
  const { t } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{t('disc.title')}</h1>
          <p className="page-sub">{t('disc.subtitle')}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-hover)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={32} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>{t('disc.hAlg')}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            {t('disc.desc')}
          </p>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>{t('disc.hHow')}</h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, paddingLeft: 20 }}>
              <li>{t('disc.li1')}</li>
              <li>{t('disc.li2')}</li>
              <li>{t('disc.li3')}</li>
              <li>{t('disc.li4')}</li>
            </ul>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('disc.checkBack')}
          </p>
        </div>
      </div>
    </div>
  );
}
