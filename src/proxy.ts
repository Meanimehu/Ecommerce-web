import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, localeOfPath, pickLocale } from '@/lib/i18n';
import { COOKIE, cookieOptions, encodeNext, isSafeLocalPath, LIFETIME_SECONDS } from '@/server/auth/cookies';

/**
 * 1. A visit with no language prefix goes to /en or /hi (Document 4, section 6): the remembered choice, else the
 *    browser's preference, else English. The redirect depends on the visitor, so it is never stored in a shared cache.
 * 2. /{lang}/login?next=/path: the asked-for page is checked (a path in our own site only), kept in the signed
 *    after-login cookie, and the address is cleaned (Document 2, section 6; Document 4, section 9).
 * Our own endpoints (/api), Next.js files and static files are left alone.
 */
const PRIVATE = 'private, no-store';

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const locale = localeOfPath(pathname);

  if (!locale) {
    const remembered = request.cookies.get(COOKIE.language)?.value;
    const target = isLocale(remembered) ? remembered : pickLocale(request.headers.get('accept-language'));
    const response = NextResponse.redirect(new URL(`/${target}${pathname === '/' ? '' : pathname}${search}`, request.url), 307);
    response.headers.set('Cache-Control', PRIVATE);
    return response;
  }

  if (pathname === `/${locale}/login` && searchParams.has('next')) {
    const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url), 303);
    response.headers.set('Cache-Control', PRIVATE);
    const asked = searchParams.get('next') ?? '';
    if (isSafeLocalPath(asked)) response.cookies.set(COOKIE.next, encodeNext(asked), cookieOptions(LIFETIME_SECONDS.next));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|api$|_next/|.*\\..*).*)'],
};
