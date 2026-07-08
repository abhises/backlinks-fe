import type { Metadata } from 'next';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/auth');
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
