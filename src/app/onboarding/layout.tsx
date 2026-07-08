import type { Metadata } from 'next';
import { getLocalizedRouteMetadata } from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedRouteMetadata('/onboarding');
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
