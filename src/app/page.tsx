import { Archivo_Black, Geist, Geist_Mono } from 'next/font/google';
import Landing from '@/components/Landing';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' });
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-archivo' });

export default function Home() {
  return <Landing fontClassName={`${geist.variable} ${geistMono.variable} ${archivoBlack.variable}`} />;
}
