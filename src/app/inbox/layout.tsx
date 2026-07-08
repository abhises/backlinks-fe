import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/inbox');
}

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

