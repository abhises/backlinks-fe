import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Locale } from '@/lib/translations';

export interface LocalizedMetadataConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
}

const metadataMap: Record<string, Record<Locale, LocalizedMetadataConfig>> = {
  '/': {
    en: {
      title: 'SERPsupport — Backlink Exchange Platform',
      description: 'Safely coordinate and track backlink placements with website owners worldwide. Guest posts, niche edits, and more.',
      keywords: ['backlink exchange', 'guest posts', 'niche edits', 'link building', 'SEO', 'SERPsupport', 'backlink platform'],
      ogTitle: 'SERPsupport — Backlink Exchange Platform',
      ogDescription: 'Safely coordinate and track backlink placements with website owners worldwide.',
    },
    fi: {
      title: 'SERPsupport — Paluulinkkien vaihtoalusta',
      description: 'Koordinoi ja seuraa turvallisesti paluulinkkien sijoituksia verkkosivustojen omistajien kanssa maailmanlaajuisesti. Vieraskynäartikkelit, niche-muokkaukset ja paljon muuta.',
      keywords: ['paluulinkkien vaihto', 'vieraskynäartikkelit', 'niche-muokkaukset', 'linkkien rakentaminen', 'hakukoneoptimointi', 'SEO', 'SERPsupport'],
      ogTitle: 'SERPsupport — Paluulinkkien vaihtoalusta',
      ogDescription: 'Koordinoi ja seuraa turvallisesti paluulinkkien sijoituksia verkkosivustojen omistajien kanssa maailmanlaajuisesti.',
    },
    nl: {
      title: 'SERPsupport — Platform voor Backlink Uitwisseling',
      description: 'Coördineer en volg veilig backlinkplaatsingen met website-eigenaren wereldwijd. Gastblogs, niche edits en meer.',
      keywords: ['backlink uitwisseling', 'gastblogs', 'niche edits', 'linkbuilding', 'SEO', 'SERPsupport'],
      ogTitle: 'SERPsupport — Platform voor Backlink Uitwisseling',
      ogDescription: 'Coördineer en volg veilig backlinkplaatsingen met website-eigenaren wereldwijd.',
    },
  },
  '/inbox': {
    en: {
      title: 'Inbox | SERPsupport',
      description: 'Manage your backlink exchange conversations, approve requests, and negotiate link placements via real-time chat.',
      keywords: ['backlink inbox', 'link exchange conversations', 'SEO chat', 'link placements'],
    },
    fi: {
      title: 'Saapuneet | SERPsupport',
      description: 'Hallinnoi linkinvaihtokeskustelujasi, hyväksy pyyntöjä ja neuvottele linkkisijoituksista reaaliaikaisessa chatissa.',
      keywords: ['saapuneet linkit', 'linkinvaihtokeskustelut', 'SEO-chat', 'linkkisijoitukset'],
    },
    nl: {
      title: 'Postvak IN | SERPsupport',
      description: 'Beheer uw linkbuilding gesprekken, keur verzoeken goed en onderhandel over linkplaatsingen via live chat.',
      keywords: ['backlink postvak', 'linkruil gesprekken', 'SEO chat', 'linkplaatsingen'],
    },
  },
  '/inbox/thread': {
    en: {
      title: 'Conversation Thread | SERPsupport',
      description: 'Real-time conversation and verification of backlink placement details.',
    },
    fi: {
      title: 'Keskustelu | SERPsupport',
      description: 'Reaaliaikainen keskustelu ja paluulinkin sijoitustiedon vahvistaminen.',
    },
    nl: {
      title: 'Gesprek | SERPsupport',
      description: 'Real-time gesprek en verificatie van backlink plaatsingsdetails.',
    },
  },
  '/dashboard': {
    en: {
      title: 'Dashboard | SERPsupport',
      description: 'Manage your websites, track domain authority and organic traffic, and monitor active link exchanges across all properties.',
      keywords: ['backlink dashboard', 'domain authority tracker', 'my websites', 'SEO metrics'],
    },
    fi: {
      title: 'Kojelauta | SERPsupport',
      description: 'Hallinnoi sivustojasi, seuraa verkkotunnuksen auktoriteettia ja orgaanista liikennettä sekä valvo aktiivisia linkinvaihtoja.',
      keywords: ['kojelauta', 'verkkotunnuksen auktoriteetti', 'omat sivustot', 'SEO-mittarit'],
    },
    nl: {
      title: 'Dashboard | SERPsupport',
      description: 'Beheer uw websites, volg domeinautoriteit en organisch verkeer en monitor actieve linkruilen op al uw domeinen.',
      keywords: ['backlink dashboard', 'domeinautoriteit tracker', 'mijn websites', 'SEO statistieken'],
    },
  },
  '/settings': {
    en: {
      title: 'Workspace Settings | SERPsupport',
      description: 'Manage your workspace profile, domain configuration, team members, and notification preferences.',
      keywords: ['workspace settings', 'SEO preferences', 'domain management'],
    },
    fi: {
      title: 'Työtilan asetukset | SERPsupport',
      description: 'Hallinnoi työtilasi profiilia, verkkotunnuksen asetuksia, tiimijäseniä ja ilmoitusasetuksia.',
      keywords: ['työtilan asetukset', 'SEO-asetukset', 'verkkotunnuksen hallinta'],
    },
    nl: {
      title: 'Werkruimte Instellingen | SERPsupport',
      description: 'Beheer uw werkruimte profiel, domeinconfiguratie, teamleden en meldingsvoorkeuren.',
      keywords: ['werkruimte instellingen', 'SEO voorkeuren', 'domeinbeheer'],
    },
  },
  '/discover': {
    en: {
      title: 'Discover Opportunities | SERPsupport',
      description: 'Explore high-authority websites across various niches looking to exchange backlinks and build strategic SEO partnerships.',
      keywords: ['discover backlinks', 'SEO partnerships', 'guest post opportunities', 'niche links'],
    },
    fi: {
      title: 'Löydä mahdollisuuksia | SERPsupport',
      description: 'Tutustu eri toimialojen korkean auktoriteetin sivustoihin, jotka haluavat vaihtaa paluulinkkejä ja rakentaa SEO-kumppanuuksia.',
      keywords: ['löydä paluulinkkejä', 'SEO-kumppanuudet', 'vieraskynäkohteet'],
    },
    nl: {
      title: 'Ontdek Kansen | SERPsupport',
      description: 'Verken websites met hoge autoriteit in diverse niches die backlinks willen uitwisselen en SEO-partnerschappen willen bouwen.',
      keywords: ['ontdek backlinks', 'SEO partnerschappen', 'gastblog kansen'],
    },
  },
  '/how-it-works': {
    en: {
      title: 'How It Works | SERPsupport',
      description: 'Learn how SERPsupport makes link building easy. Connect, negotiate via chat, and verify placements without middleman agencies.',
      keywords: ['how SERPsupport works', 'backlink exchange guide', 'SEO link building tutorial'],
    },
    fi: {
      title: 'Kuinka se toimii | SERPsupport',
      description: 'Opi kuinka SERPsupport tekee linkkien rakentamisesta helppoa. Yhdistä, neuvottele chatissa ja vahvista sijoitukset ilman välikäsiä.',
      keywords: ['kuinka SERPsupport toimii', 'paluulinkkien opas', 'linkkien rakentaminen'],
    },
    nl: {
      title: 'Hoe Het Werkt | SERPsupport',
      description: 'Ontdek hoe SERPsupport linkbuilding eenvoudig maakt. Verbind, onderhandel via chat en verifieer plaatsingen zonder tussenpersoon.',
      keywords: ['hoe SERPsupport werkt', 'backlink uitwisseling gids', 'SEO linkbuilding tutorial'],
    },
  },
  '/auth': {
    en: {
      title: 'Sign In & Sign Up | SERPsupport',
      description: 'Log in to your SERPsupport workspace or start your 7-day free trial to grow your domain authority with authentic link exchanges.',
      keywords: ['SERPsupport login', 'sign up SEO platform', 'free trial link building'],
    },
    fi: {
      title: 'Kirjaudu & Rekisteröidy | SERPsupport',
      description: 'Kirjaudu SERPsupport-työtilaasi tai aloita 7 päivän ilmainen kokeilu kasvattaaksesi sivustosi auktoriteettia aidoilla linkinvaihdoilla.',
      keywords: ['SERPsupport kirjautuminen', 'rekisteröidy SEO-alustalle', 'ilmainen kokeilu linkinrakennus'],
    },
    nl: {
      title: 'Inloggen & Registreren | SERPsupport',
      description: 'Log in op uw SERPsupport werkruimte of start uw gratis proefperiode van 7 dagen om uw domeinautoriteit te versterken.',
      keywords: ['SERPsupport inloggen', 'registreren SEO platform', 'gratis proefperiode linkbuilding'],
    },
  },
  '/onboarding': {
    en: {
      title: 'Workspace Onboarding | SERPsupport',
      description: 'Set up your website profile and SEO metrics to begin finding and exchanging backlinks right away.',
    },
    fi: {
      title: 'Työtilan käyttöönotto | SERPsupport',
      description: 'Määritä sivustosi profiili ja SEO-tunnusluvut aloittaaksesi paluulinkkien etsimisen ja vaihtamisen heti.',
    },
    nl: {
      title: 'Werkruimte Onboarding | SERPsupport',
      description: 'Stel uw websiteprofiel en SEO-statistieken in om direct backlinks te vinden en uit te wisselen.',
    },
  },
  '/reset-password': {
    en: {
      title: 'Reset Password | SERPsupport',
      description: 'Enter a new secure password for your SERPsupport workspace account.',
    },
    fi: {
      title: 'Palauta salasana | SERPsupport',
      description: 'Syötä uusi turvallinen salasana SERPsupport-työtilatilillesi.',
    },
    nl: {
      title: 'Wachtwoord Herstellen | SERPsupport',
      description: 'Voer een nieuw veilig wachtwoord in voor uw SERPsupport werkruimte account.',
    },
  },
  '/admin': {
    en: {
      title: 'Admin Control Panel | SERPsupport',
      description: 'SERPsupport administrative portal for user management, backlink verification, notifications, and system settings.',
    },
    fi: {
      title: 'Ylläpidon hallintapaneeli | SERPsupport',
      description: 'SERPsupport-hallintaportaali käyttäjien hallintaan, linkkien vahvistamiseen ja järjestelmäasetuksiin.',
    },
    nl: {
      title: 'Admin Beheerpaneel | SERPsupport',
      description: 'SERPsupport administratieportaal voor gebruikersbeheer, backlink verificatie, meldingen en systeeminstellingen.',
    },
  },
};

export async function detectServerLocale(): Promise<Locale> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const xLocale = headersList.get('x-locale') as Locale | null;

    if (xLocale && (xLocale === 'fi' || xLocale === 'nl' || xLocale === 'en')) {
      return xLocale;
    }
    if (host.startsWith('fi.') || host === 'fi.serpsupport.com') {
      return 'fi';
    } else if (host.startsWith('nl.') || host === 'nl.serpsupport.com') {
      return 'nl';
    }
  } catch {}
  return 'en';
}

export async function getLocalizedRouteMetadata(routePath: string = '/'): Promise<Metadata> {
  const locale = await detectServerLocale();
  const routeConfig = metadataMap[routePath] || metadataMap['/'];
  const data = routeConfig[locale] || routeConfig['en'];

  const baseUrl = 'https://serpsupport.com';
  const fiUrl = 'https://fi.serpsupport.com';
  const nlUrl = 'https://nl.serpsupport.com';

  const cleanPath = routePath === '/' ? '' : routePath;
  const canonicalUrl = locale === 'fi'
    ? `${fiUrl}${cleanPath}`
    : locale === 'nl'
    ? `${nlUrl}${cleanPath}`
    : `${baseUrl}${cleanPath}`;

  return {
    metadataBase: new URL(canonicalUrl),
    title: data.title,
    description: data.description,
    keywords: data.keywords || ['backlinks', 'SEO', 'link building', 'SERPsupport'],
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg',
    },
    openGraph: {
      title: data.ogTitle || data.title,
      description: data.ogDescription || data.description,
      url: canonicalUrl,
      siteName: 'SERPsupport',
      locale: locale === 'fi' ? 'fi_FI' : locale === 'nl' ? 'nl_NL' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/favicon.png',
          width: 1200,
          height: 630,
          alt: `${data.title} — SERPsupport`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.ogTitle || data.title,
      description: data.ogDescription || data.description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}${cleanPath}`,
        'fi': `${fiUrl}${cleanPath}`,
        'nl': `${nlUrl}${cleanPath}`,
        'x-default': `${baseUrl}${cleanPath}`,
      },
    },
  };
}

