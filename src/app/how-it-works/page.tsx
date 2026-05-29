import React from 'react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: 1,
      title: 'Get matched',
      desc: 'We pair your site with relevant partners in the SERPsupport network.'
    },
    {
      num: 2,
      title: 'Approve or reject',
      desc: "Review each new request and decide if it's a fit for your site."
    },
    {
      num: 3,
      title: 'Chat & agree',
      desc: 'Discuss the placement, target page, and anchor text directly.'
    },
    {
      num: 4,
      title: 'Place the link',
      desc: 'Once both sides agree, the backlink goes live and the deal is closed.'
    },
    {
      num: 5,
      title: 'Track your link profile',
      desc: "Use the Dashboard to monitor every backlink in and out — see what's live and what's been removed."
    }
  ];

  return (
    <div style={{ padding: '32px 40px', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>How it works</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
          A quick walkthrough of how SERPsupport connects your site with the right partners.
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
