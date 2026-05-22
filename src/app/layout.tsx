import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LinkLoop — Backlink Exchange Platform",
  description: "Safely coordinate and track backlink placements with website owners worldwide. Guest posts, niche edits, and more.",
  keywords: "backlink exchange, guest posts, niche edits, link building, SEO",
  openGraph: {
    title: "LinkLoop — Backlink Exchange Platform",
    description: "Safely coordinate and track backlink placements.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.variable}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
