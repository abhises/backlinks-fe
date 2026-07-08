import type { Metadata } from 'next';
import AdminShell from '@/components/AdminShell';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/admin');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

