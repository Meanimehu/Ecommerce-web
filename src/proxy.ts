import { NextResponse, type NextRequest } from 'next/server';
import { localeOfPath, pickLocale } from '@/lib/i18n';

/**
 * Sends a visit with no language prefix to /en or /hi (Document 4, section 6). The redirect depends on the visitor, so
 * it is never stored in a shared cache. Our own endpoints (/api), Next.js files and static files are left alone.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (localeOfPath(pathname)) return NextResponse.next();
  const locale = pickLocale(request.headers.get('accept-language'));
  const target = new URL(`/${locale}${pathname === '/' ? '' : pathname}${search}`, request.url);
  const response = NextResponse.redirect(target, 307);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  matcher: ['/((?!api/|api$|_next/|.*\\..*).*)'],
};
