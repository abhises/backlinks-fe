import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { headers } from "next/headers";
import { Locale } from "@/lib/translations";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SERPsupport — Backlink Exchange Platform",
  description: "Safely coordinate and track backlink placements with website owners worldwide. Guest posts, niche edits, and more.",
  keywords: "backlink exchange, guest posts, niche edits, link building, SEO",
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: "SERPsupport — Backlink Exchange Platform",
    description: "Safely coordinate and track backlink placements.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  let initialLocale: Locale = 'en';
  if (host.startsWith('fi.')) {
    initialLocale = 'fi';
  } else if (host.startsWith('nl.')) {
    initialLocale = 'nl';
  }

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var params = new URLSearchParams(window.location.search);
                  var urlTheme = params.get('bl_theme');
                  var cookieTheme = (document.cookie.match(/bl_theme=([^;]+)/) || [])[1];
                  var theme = urlTheme || cookieTheme || localStorage.getItem('bl_theme') || 'dark';
                  if (urlTheme) {
                    localStorage.setItem('bl_theme', urlTheme);
                    var newSearch = window.location.search.replace(/([?&])bl_theme=[^&]+(&?)/, function(match, p1, p2) {
                      return p2 ? p1 : '';
                    }).replace(/[?&]$/, '');
                    window.history.replaceState(null, '', window.location.pathname + newSearch + window.location.hash);
                  } else if (!localStorage.getItem('bl_theme') && theme) {
                    localStorage.setItem('bl_theme', theme);
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <LanguageProvider initialLocale={initialLocale}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
