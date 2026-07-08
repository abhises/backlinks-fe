import type { Metadata } from 'next';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/reset-password');
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
