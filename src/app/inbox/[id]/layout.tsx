import type { Metadata } from 'next';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/inbox/thread');
}

export default function ThreadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
