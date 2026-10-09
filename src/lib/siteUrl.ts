import { detectServerLocale } from './metadata';
import type { Locale } from './translations';

export const siteUrls: Record<Locale, string> = {
  en: 'https://serpsupport.com',
  fi: 'https://fi.serpsupport.com',
  nl: 'https://nl.serpsupport.com',
};

export async function getSiteUrl(): Promise<string> {
  return siteUrls[await detectServerLocale()];
}
