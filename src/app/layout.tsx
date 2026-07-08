import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { headers } from "next/headers";
import { Locale } from "@/lib/translations";
import { getLocalizedRouteMetadata, detectServerLocale } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/');
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLocale = await detectServerLocale();

  return (
    <html lang={initialLocale} data-theme="dark" suppressHydrationWarning>
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
