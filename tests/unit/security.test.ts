import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import { COOKIE, isSafeLocalPath, sign, unsign } from '@/middleware/cookies';
import { guardChange } from '@/middleware/responses';
import {
  forgetPageAfterLogin,
  readPageAfterLogin,
  rememberPageAfterLogin,
} from '@/features/auth/after-login-page';
import { defaultDestination } from '@/features/auth/server/session';

describe('after-login path (Document 2, section 6: no open redirects)', () => {
  it.each(['/en/account', '/hi/admin?x=1', '/en'])('accepts %s', (p) =>
    expect(isSafeLocalPath(p)).toBe(true),
  );
  it.each([
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'evil.com',
    '',
    '/\nfoo',
    `/${'a'.repeat(600)}`,
  ])('refuses %j', (p) => expect(isSafeLocalPath(p)).toBe(false));
  const remembered = (path: string) => {
    const response = NextResponse.json({});
    rememberPageAfterLogin(response, path);
    return response.cookies.get(COOKIE.next)?.value;
  };
  const withCookie = (value: string) =>
    new NextRequest('https://localhost:3001/api/auth/verify', {
      headers: { cookie: `${COOKIE.next}=${value}` },
    });

  it('is signed: a changed cookie is refused', () => {
    const value = remembered('/en/account') as string;
    expect(readPageAfterLogin(withCookie(value))).toBe('/en/account');
    const [body, sig] = value.split('.');
    const forged = `${Buffer.from(JSON.stringify({ p: '/en/admin' })).toString('base64url')}.${sig}`;
    expect(readPageAfterLogin(withCookie(forged))).toBeNull();
    expect(readPageAfterLogin(withCookie(`${body}.x`))).toBeNull();
  });
  it('a page outside our site is never remembered', () => {
    expect(remembered('//evil.com')).toBeUndefined();
    expect(remembered('https://evil.com')).toBeUndefined();
  });
  it('is used once: the login answer deletes it', () => {
    const response = NextResponse.json({});
    forgetPageAfterLogin(response);
    expect(response.cookies.get(COOKIE.next)?.value).toBe('');
    expect(response.headers.get('set-cookie')).toMatch(/Max-Age=0/i);
  });
  it('sign and unsign', () => {
    expect(unsign(sign({ a: 1 }))).toEqual({ a: 1 });
    expect(unsign('made.up')).toBeNull();
  });
});

describe('forgery protection (Document 7, section 17.3; D7-13)', () => {
  const post = (headers: Record<string, string>) =>
    new NextRequest('https://localhost:3001/api/language', { method: 'POST', headers });

  it('accepts our own origin with our header', () => {
    expect(
      guardChange(post({ origin: 'https://localhost:3001', 'x-dhaaga-csrf': '1' })),
    ).toBeNull();
  });
  it.each([
    [{ origin: 'https://localhost:3001.evil.com', 'x-dhaaga-csrf': '1' }, 'ORIGIN_INVALID'],
    [{ origin: 'http://localhost:3001', 'x-dhaaga-csrf': '1' }, 'ORIGIN_INVALID'],
    [{ 'x-dhaaga-csrf': '1' }, 'ORIGIN_INVALID'],
    [{ origin: 'https://localhost:3001' }, 'CSRF_INVALID'],
    [{ origin: 'https://localhost:3001', 'x-dhaaga-csrf': 'yes' }, 'CSRF_INVALID'],
  ])('refuses %j with %s', async (headers, code) => {
    const answer = guardChange(post(headers));
    expect(answer?.status).toBe(403);
    const { error } = await answer!.json();
    expect(error.code).toBe(code);
    // Our server decided this by itself: no made-up reference number that nobody could look up (D5-14).
    expect(error).not.toHaveProperty('requestId');
  });
});

describe('where a person goes after login (D2-03)', () => {
  it('staff to the Admin area, an approved vendor to the Vendor area, everyone else to the shop', () => {
    expect(defaultDestination(['customer', 'moderator'], 'en')).toBe('/en/admin');
    expect(defaultDestination(['customer', 'vendor_owner'], 'hi')).toBe('/hi/vendor');
    expect(defaultDestination(['customer'], 'en')).toBe('/en');
  });
});
