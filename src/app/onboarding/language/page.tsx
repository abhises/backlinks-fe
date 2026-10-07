import { redirect } from 'next/navigation';

// Language selection was removed from signup; English is the default.
// Keep this route as a redirect for old links/bookmarks.
export default function LanguageSelectionPage() {
  redirect('/onboarding');
}
