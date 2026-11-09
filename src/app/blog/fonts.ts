import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter' });
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-inter-tight' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });

/** Font CSS variables used by blog.module.css (shared by the public blog and the admin preview). */
export const blogFontVars = `${inter.variable} ${interTight.variable} ${mono.variable}`;
