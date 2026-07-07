'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Locale, translations } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLocale?: Locale }> = ({ children, initialLocale = 'en' }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.startsWith('fi.')) return 'fi';
      if (host.startsWith('nl.')) return 'nl';
      return 'en';
    }
    return initialLocale;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      // Detect locale from subdomain: fi. -> fi, nl. -> nl, otherwise strictly en (default without subdomain)
      if (host.startsWith('fi.')) {
        setLocaleState('fi');
        Cookies.set('NEXT_LOCALE', 'fi', { expires: 365, path: '/' });
      } else if (host.startsWith('nl.')) {
        setLocaleState('nl');
        Cookies.set('NEXT_LOCALE', 'nl', { expires: 365, path: '/' });
      } else {
        setLocaleState('en');
        Cookies.set('NEXT_LOCALE', 'en', { expires: 365, path: '/' });
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    Cookies.set('NEXT_LOCALE', newLocale, { expires: 365, path: '/' });

    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;

      const currentTheme = localStorage.getItem('bl_theme') || document.documentElement.getAttribute('data-theme') || 'dark';
      Cookies.set('bl_theme', currentTheme, { expires: 365, path: '/' });

      let targetHostname = host;

      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        // Local development subdomain routing (e.g., fi.localhost:3000, nl.localhost:3000)
        if (newLocale === 'fi') {
          targetHostname = 'fi.localhost';
        } else if (newLocale === 'nl') {
          targetHostname = 'nl.localhost';
        } else {
          targetHostname = 'localhost';
        }
      } else if (host.includes('serpsupport.com')) {
        // Production subdomain routing
        if (newLocale === 'fi') {
          targetHostname = 'fi.serpsupport.com';
        } else if (newLocale === 'nl') {
          targetHostname = 'nl.serpsupport.com';
        } else {
          targetHostname = 'www.serpsupport.com';
        }
      } else {
        // For other environments without subdomain DNS, just reload to apply cookie
        window.location.reload();
        return;
      }

      if (host !== targetHostname) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('bl_theme', currentTheme);
        const searchStr = `?${urlParams.toString()}`;
        const newUrl = `${protocol}//${targetHostname}${port}${window.location.pathname}${searchStr}`;
        window.location.href = newUrl;
        return;
      } else {
        window.location.reload();
      }
    }
  };

  const t = (key: string): string => {
    const dict = translations[locale] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
