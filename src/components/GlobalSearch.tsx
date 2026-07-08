'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { X, Globe, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

type Workspace = {
  id: string;
  domain: string;
  websiteName: string;
  niche?: string;
  country?: string;
  description?: string;
  createdAt: string;
};

type Thread = {
  id: string;
  giverWorkspace: Workspace;
  receiverWorkspace: Workspace;
  messages: { messageText: string }[];
};

const getInitials = (domain: string) => {
  const parts = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.');
  return (parts.length > 0 ? parts[0] : domain).substring(0, 2).toUpperCase();
};

const getAvatarColor = (domain: string) => {
  const colors = [
    { bg: '#d0e1fd', text: '#1e40af' },
    { bg: '#fed7aa', text: '#c2410c' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#e9d5ff', text: '#6b21a8' },
  ];
  let sum = 0;
  const cleanDomain = domain.toLowerCase().trim();
  for (let i = 0; i < cleanDomain.length; i++) sum += cleanDomain.charCodeAt(i);
  return colors[sum % colors.length];
};

const CONTACT_NAMES: Record<string, string> = {
  'fernway.io': 'Mira',
  'ledgerpost.com': 'Devon',
  'byteweekly.dev': 'Lukas',
  'petalpress.co': 'Noor',
  'hikersguide.no': 'Ingrid',
  'northlight.studio': 'Mira',
  'kettle-and-bean.com': 'Owen',
};

const getContactName = (domain: string) => {
  const normalized = domain.toLowerCase().trim();
  if (CONTACT_NAMES[normalized]) return CONTACT_NAMES[normalized];
  return 'Admin';
};

const getCountryEmoji = (countryName?: string) => {
  if (!countryName) return '';
  const mapping: Record<string, string> = {
    'sweden': '🇸🇪', 'united states': '🇺🇸', 'uk': '🇬🇧', 'canada': '🇨🇦', 'norway': '🇳🇴', 'germany': '🇩🇪'
  };
  return mapping[countryName.toLowerCase()] || '';
};

export default function GlobalSearch() {
  const { t } = useLanguage();
  const { workspace } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Workspace | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{top: number, left: number, width: number}>({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    if (!workspace) return;
    const fetchThreads = async () => {
      try {
        const res = await api.get('/api/threads?filter=all');
        setThreads(res.data.threads || []);
      } catch (err) {}
    };
    fetchThreads();
  }, [workspace]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    window.dispatchEvent(new CustomEvent('bl_search', { detail: val }));
  };

  const showDropdown = isFocused && query.trim().length > 0;

  useEffect(() => {
    if (showDropdown && inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width * 1.5, 300) // Make it wider than the input to match the image
      });
    }
  }, [showDropdown, query]);

  // Derive partners and matching threads
  const partnersMap = new Map<string, Workspace>();
  const matchingThreads: Array<{id: string, text: string, domain: string, ws: Workspace}> = [];

  const q = query.toLowerCase();

  threads.forEach(thr => {
    const other = thr.giverWorkspace.id === workspace?.id ? thr.receiverWorkspace : thr.giverWorkspace;
    
    const partnerMatch = other.domain.toLowerCase().includes(q) || other.websiteName.toLowerCase().includes(q);
    if (partnerMatch && !partnersMap.has(other.id)) {
      partnersMap.set(other.id, other);
    }

    const messageText = thr.messages?.[0]?.messageText || t('inbox.noMessages');
    if (partnerMatch || messageText.toLowerCase().includes(q)) {
      matchingThreads.push({
        id: thr.id,
        text: messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText,
        domain: other.domain,
        ws: other
      });
    }
  });

  const partners = Array.from(partnersMap.values()).slice(0, 10);
  // Also slice matchingThreads to 10 for consistency
  const displayedThreads = matchingThreads.slice(0, 10);

  const openPartnerModal = (ws: Workspace) => {
    setSelectedPartner(ws);
    setIsFocused(false);
    setQuery('');
    window.dispatchEvent(new CustomEvent('bl_search', { detail: '' }));
  };

  const handleThreadClick = (id: string) => {
    setIsFocused(false);
    setQuery('');
    window.dispatchEvent(new CustomEvent('bl_search', { detail: '' }));
    router.push(`/inbox/${id}`);
  };

  return (
    <div ref={dropdownRef} style={{ padding: '0 20px', marginBottom: '16px', position: 'relative' }}>
      <div ref={inputContainerRef} style={{ position: 'relative', zIndex: showDropdown ? 101 : 1 }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', opacity: 0.6 }}>🔍</span>
        <input 
          type="text" 
          placeholder={t('app.searchPlaceholder')} 
          value={query}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          style={{
            width: '100%', padding: '6px 12px 6px 30px', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)',
            fontSize: '0.8rem', outline: 'none', transition: 'border-color 0.15s'
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        {query && (
          <button onClick={() => handleSearchChange('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
            <X size={12} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'fixed', top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width,
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 10000, maxHeight: '350px', overflowY: 'auto'
        }}>
          {partners.length === 0 && displayedThreads.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('app.noResults')}
            </div>
          )}

          {partners.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '4px 16px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('app.partners')}</div>
              {partners.map(p => {
                const avatarStyle = getAvatarColor(p.domain);
                const contact = getContactName(p.domain);
                return (
                  <div key={p.id} onClick={() => openPartnerModal(p)} style={{
                    padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer', transition: 'background 0.15s'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarStyle.bg, color: avatarStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                      {getInitials(p.domain)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.domain}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{contact} · {p.niche || t('app.general')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayedThreads.length > 0 && (
            <div style={{ padding: '8px 0', borderTop: partners.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ padding: '4px 16px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t('app.threads')}</div>
              {displayedThreads.map(item => {
                const avatarStyle = getAvatarColor(item.domain);
                return (
                  <div key={item.id} onClick={() => handleThreadClick(item.id)} style={{
                    padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    cursor: 'pointer', transition: 'background 0.15s'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarStyle.bg, color: avatarStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                      {getInitials(item.domain)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.text}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.domain}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedPartner && (
        <>
          <div onClick={() => setSelectedPartner(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(2px)'
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--bg-surface)', borderRadius: '12px', width: '90%', maxWidth: '450px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1001, overflow: 'hidden', border: '1px solid var(--border)'
          }}>
            <div style={{ padding: '24px', position: 'relative' }}>
              <button onClick={() => setSelectedPartner(null)} style={{
                position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
              }}>
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: getAvatarColor(selectedPartner.domain).bg,
                  color: getAvatarColor(selectedPartner.domain).text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 600
                }}>
                  {getInitials(selectedPartner.domain)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedPartner.domain}
                    </h3>
                    <span style={{ fontSize: '1rem' }}>{getCountryEmoji(selectedPartner.country || 'sweden')}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedPartner.websiteName} · {getContactName(selectedPartner.domain)}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '24px', fontStyle: 'italic' }}>
                {selectedPartner.description || t('app.noDescription')}
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
                    <Globe size={12} /> {t('dash.niche')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: '"Lora", "Georgia", serif' }}>
                    {selectedPartner.niche || t('app.general')}
                  </div>
                </div>
                <div style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
                    <Clock size={12} /> {t('app.avgResponse')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: '"Lora", "Georgia", serif' }}>
                    {t('app.sixHours')}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('app.inSerpSupportSince')} {new Date(selectedPartner.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <a href={`https://${selectedPartner.domain}`} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none'
              }}>
                {t('app.visitSite')} <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
