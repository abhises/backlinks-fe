import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Provide feedback',
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
