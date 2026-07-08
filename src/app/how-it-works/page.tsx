'use client';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const steps = [
    {
      num: 1,
      title: t('hiw.step1Title'),
      desc: t('hiw.step1Desc')
    },
    {
      num: 2,
      title: t('hiw.step2Title'),
      desc: t('hiw.step2Desc')
    },
    {
      num: 3,
      title: t('hiw.step3Title'),
      desc: t('hiw.step3Desc')
    },
    {
      num: 4,
      title: t('hiw.step4Title'),
      desc: t('hiw.step4Desc')
    },
    {
      num: 5,
      title: t('hiw.step5Title'),
      desc: t('hiw.step5Desc')
    }
  ];

  return (
    <div style={{ padding: '32px 40px', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>{t('hiw.title')}</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
          {t('hiw.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '550px', margin: '0 auto' }}>
        {steps.map(step => (
          <div key={step.num} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '16px', 
            padding: '16px 24px', 
            border: '1px solid var(--border)', 
            borderRadius: '10px', 
            background: 'var(--bg-surface)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#1a1a1a', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 600,
              fontSize: '0.9rem',
              flexShrink: 0 
            }}>
              {step.num}
            </div>
            <div style={{ paddingTop: '5px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}>{step.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
