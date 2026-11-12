import { NextResponse, type NextRequest } from 'next/server';
import { isLocale, localeOfPath, pickLocale } from '@/lib/i18n';
import { COOKIE, PATH_HEADER } from '@/middleware/cookies';
import { rememberPageAfterLogin } from '@/features/auth/after-login-page';

/**
 * 1. A visit with no language prefix goes to /en or /hi (Document 4, section 6): the remembered choice, else the
 *    browser's preference, else English. The redirect depends on the visitor, so it is never stored in a shared cache.
 * 2. /{lang}/login?next=/path: the asked-for page is checked (a path in our own site only), kept in the signed
 *    after-login cookie, and the address is cleaned (Document 2, section 6; Document 4, section 9).
 * 3. Every page request carries its own address to the server render (PATH_HEADER), so a login guard in a layout can
 *    return the person to the exact page they asked for (Document 2, D2-03).
 * 4. Pages may load images only from our own site and the public photo host (IMAGE_HOST; Document 3, D3-04).
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
    rememberPageAfterLogin(response, searchParams.get('next') ?? '');
    return response;
  }

  // The page's own address, for the login guard in layouts (which Next.js does not tell its address). Always set
  // here, so a value sent by the browser is never used.
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, `${pathname}${search}`);
  const response = NextResponse.next({ request: { headers } });
  // Pages may load images only from our own site and the public photo host (Document 3, D3-04).
  const imageHost = imageOrigin();
  response.headers.set('Content-Security-Policy', `img-src 'self' data: blob:${imageHost ? ` ${imageHost}` : ''}`);
  return response;
}

function imageOrigin(): string | null {
  try {
    return process.env.IMAGE_HOST ? new URL(process.env.IMAGE_HOST).origin : null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/((?!api/|api$|_next/|.*\\..*).*)'],
};
