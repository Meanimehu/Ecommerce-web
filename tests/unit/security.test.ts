import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { decodeNext, encodeNext, isSafeLocalPath, sign, unsign } from '@/server/auth/cookies';
import { guardChange } from '@/server/auth/http';
import { defaultDestination } from '@/server/auth/session';

describe('after-login path (Document 2, section 6: no open redirects)', () => {
  it.each(['/en/account', '/hi/admin?x=1', '/en'])('accepts %s', (p) => expect(isSafeLocalPath(p)).toBe(true));
  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', '', '/\nfoo', `/${'a'.repeat(600)}`])('refuses %j', (p) =>
    expect(isSafeLocalPath(p)).toBe(false),
  );
  it('is signed: a changed cookie is refused', () => {
    const value = encodeNext('/en/account');
    expect(decodeNext(value)).toBe('/en/account');
    const [body, sig] = value.split('.');
    const forged = `${Buffer.from(JSON.stringify({ p: '/en/admin' })).toString('base64url')}.${sig}`;
    expect(decodeNext(forged)).toBeNull();
    expect(decodeNext(`${body}.x`)).toBeNull();
  });
  it('sign and unsign', () => {
    expect(unsign(sign({ a: 1 }))).toEqual({ a: 1 });
    expect(unsign('made.up')).toBeNull();
  });
});

describe('forgery protection (Document 7, section 17.3; D7-13)', () => {
  const post = (headers: Record<string, string>) => new NextRequest('https://localhost:3001/api/language', { method: 'POST', headers });

  it('accepts our own origin with our header', () => {
    expect(guardChange(post({ origin: 'https://localhost:3001', 'x-dhaaga-csrf': '1' }))).toBeNull();
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
    expect((await answer?.json()).error.code).toBe(code);
  });
});

describe('where a person goes after login (D2-03)', () => {
  it('staff to the Admin area, an approved vendor to the Vendor area, everyone else to the shop', () => {
    expect(defaultDestination(['customer', 'moderator'], 'en')).toBe('/en/admin');
    expect(defaultDestination(['customer', 'vendor_owner'], 'hi')).toBe('/hi/vendor');
    expect(defaultDestination(['customer'], 'en')).toBe('/en');
  });
});
