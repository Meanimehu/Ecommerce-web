import { describe, expect, it } from 'vitest';
import { decodeNext, encodeNext, isSafeLocalPath } from '@/server/auth/cookie-basics';
import { decrypt, deriveKey, encrypt, sign, unsign } from '@/server/auth/crypto';
import { originAllowed, preLoginToken, sessionToken, verifyCsrf } from '@/server/auth/csrf';
import { defaultDestination } from '@/server/auth/destination';

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
});

describe('anti-forgery tokens (Document 2, section 6; D7-13)', () => {
  it('a session token is tied to its login id', () => {
    const token = sessionToken('login-a');
    expect(verifyCsrf(token, 'login-a', 'session')).toBe(true);
    expect(verifyCsrf(token, 'login-b', 'session')).toBe(false);
    expect(verifyCsrf(token, null, 'session')).toBe(false);
  });
  it('a pre-login token works only on the login endpoints, and only for 15 minutes', () => {
    const now = Date.now();
    const token = preLoginToken(now);
    expect(verifyCsrf(token, null, 'session-or-pre-login', now)).toBe(true);
    expect(verifyCsrf(token, null, 'session', now)).toBe(false);
    expect(verifyCsrf(token, null, 'session-or-pre-login', now + 16 * 60_000)).toBe(false);
  });
  it('refuses a missing or made-up token', () => {
    expect(verifyCsrf(null, 'x', 'session-or-pre-login')).toBe(false);
    expect(verifyCsrf('p.abc.def', null, 'session-or-pre-login')).toBe(false);
    expect(verifyCsrf('s.made-up', 'x', 'session')).toBe(false);
  });
  it('checks the exact Origin', () => {
    expect(originAllowed('https://localhost:3001')).toBe(true);
    expect(originAllowed('https://localhost:3001.evil.com')).toBe(false);
    expect(originAllowed('http://localhost:3001')).toBe(false);
    expect(originAllowed(null)).toBe(false);
  });
});

describe('crypto helpers', () => {
  it('encrypts and decrypts; a changed byte fails', () => {
    const key = deriveKey('a-secret-a-secret-a-secret-a-secret', 'result');
    const sealed = encrypt(key, 'access-token');
    expect(decrypt(key, sealed)).toBe('access-token');
    sealed.writeUInt8(sealed.readUInt8(sealed.length - 1) ^ 1, sealed.length - 1);
    expect(() => decrypt(key, sealed)).toThrow();
  });
  it('sign and unsign', () => {
    expect(unsign('k', sign('k', { a: 1 }))).toEqual({ a: 1 });
    expect(unsign('other', sign('k', { a: 1 }))).toBeNull();
  });
});

describe('where a person goes after login (D2-03)', () => {
  it('staff to the Admin area, an approved vendor to the Vendor area, everyone else to the shop', () => {
    expect(defaultDestination(['customer', 'moderator'], 'en')).toBe('/en/admin');
    expect(defaultDestination(['customer', 'vendor_owner'], 'hi')).toBe('/hi/vendor');
    expect(defaultDestination(['customer'], 'en')).toBe('/en');
  });
});
