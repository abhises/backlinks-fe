import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  let locale = 'en';

  // Check subdomain routing: fi. -> fi, nl. -> nl, otherwise strictly en (default without subdomain)
  if (hostname.startsWith('fi.') || hostname === 'fi.serpsupport.com') {
    locale = 'fi';
  } else if (hostname.startsWith('nl.') || hostname === 'nl.serpsupport.com') {
    locale = 'nl';
  } else {
    locale = 'en';
  }

  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  response.headers.set('x-locale', locale);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
