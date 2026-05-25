'use client';
import { useAuth } from '@/context/AuthContext';
import { Globe, Clock } from 'lucide-react';

export default function DiscoverPage() {
  const { workspace } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Discover Matches</h1>
          <p className="page-sub">Your curated weekly connection matches.</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 600, padding: 40, textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-hover)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={32} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Matching Algorithm in Progress</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            SERPsupport is a give-and-take network. Instead of manually searching through thousands of sites, our matching system will automatically pair you with highly relevant partners.
          </p>
          <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'left', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>How it will work:</h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, paddingLeft: 20 }}>
              <li>Every week, you'll receive <strong>4 curated connection requests</strong>.</li>
              <li><strong>2 sites</strong> where you can place your backlinks.</li>
              <li><strong>2 sites</strong> that will place their backlinks on your domain.</li>
              <li>Accept the matches to open a dedicated inbox thread and securely finalize the details.</li>
            </ul>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Check back soon for your first batch of matches!
          </p>
        </div>
      </div>
    </div>
  );
}
