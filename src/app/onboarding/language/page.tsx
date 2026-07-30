'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Locale } from '@/lib/translations';
import { Link2, Check, Loader2 } from 'lucide-react';

const REGIONS = [
  {
    code: 'en' as Locale,
    flag: '🇬🇧',
    name: 'English',
    region: 'Global / United Kingdom & United States',
  },
  {
    code: 'fi' as Locale,
    flag: '🇫🇮',
    name: 'Suomi',
    region: 'Suomi / Finland',
  },
  {
    code: 'nl' as Locale,
    flag: '🇳🇱',
    name: 'Nederlands',
    region: 'Nederland & België / Netherlands & Belgium',
  },
];

export default function LanguageSelectionPage() {
  const { t, locale, setLocale } = useLanguage();
  const { updateUserLanguage, logout } = useAuth();
  const [selected, setSelected] = useState<Locale>(locale || 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Order: current subdomain's language first, then English (unless it's already
  // first), then the remaining language. e.g. on nl.localhost -> Nederlands, English, Suomi.
  // Computed post-mount (not during the initial render) so SSR output and the
  // client's first paint always match, avoiding a hydration mismatch.
  const [regions, setRegions] = useState(REGIONS);

  useEffect(() => {
    const orderedCodes: Locale[] =
      locale === 'en'
        ? ['en', 'nl', 'fi']
        : [locale, 'en', (['nl', 'fi'] as Locale[]).find((c) => c !== locale)!];
    setRegions(orderedCodes.map((code) => REGIONS.find((r) => r.code === code)!));
  }, [locale]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (updateUserLanguage) {
        await updateUserLanguage(selected);
      }
      setLocale(selected, '/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update language setting');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3, pointerEvents: 'none' }} />

      <div className="auth-card animate-slide-up" style={{ 
        maxWidth: 540, 
        width: '100%', 
        background: '#222524', 
        border: '1px solid #323634', 
        borderRadius: 16, 
        padding: '36px 36px 32px 36px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: '#419d78', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Link2 size={20} />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
              SERPsupport
            </span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8e9391' }}>
            {t('onboard.step2Indicator') || 'Step 2 of 3'}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {t('onboard.step2Title') || 'Select your region & language'}
        </h1>
        <p style={{ color: '#8e9391', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
          {t('onboard.step2Desc') || 'Choose your preferred language portal for your SERPsupport account.'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: '0.875rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleContinue}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {regions.map((item) => {
              const isSelected = selected === item.code;
              return (
                <div
                  key={item.code}
                  onClick={() => setSelected(item.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    borderRadius: 12,
                    background: isSelected ? 'rgba(65, 157, 120, 0.15)' : '#2c302e',
                    border: `1.5px solid ${isSelected ? '#419d78' : '#383d3b'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#555b58';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#383d3b';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.flag}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#e2e6e4' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#8e9391' }}>
                        {item.region}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#419d78' : '#555b58'}`,
                    background: isSelected ? '#419d78' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 44,
                padding: '10px 16px',
                background: '#419d78',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'filter 0.2s, opacity 0.2s',
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {t('onboard.continue') || 'Continue'}
            </button>

            <button
              type="button"
              onClick={() => logout('/auth?mode=register')}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#c5c9c7',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 0',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#c5c9c7'}
            >
              ← {t('onboard.back') || 'Back'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
