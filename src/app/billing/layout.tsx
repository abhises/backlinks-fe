import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/billing');
}

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
