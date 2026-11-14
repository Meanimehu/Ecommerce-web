import { describe, expect, it } from 'vitest';
import { pageWindow } from '@/components/common/pagination';
import { checkFile, formatSize } from '@/lib/uploads';
import { expiresWithin } from '@/features/auth/server/session';
import { pageNumber, pick, withQuery } from '@/utils/url';

describe('list addresses (Document 4, section 7; Document 5, section 3)', () => {
  it('leaves out empty values and keeps keys in one order, so equal requests look the same', () => {
    expect(
      withQuery('/api/admin/vendors', { status: 'submitted', q: '', page: 2, limit: 20 }),
    ).toBe('/api/admin/vendors?limit=20&page=2&status=submitted');
    expect(withQuery('/x', { b: '1', a: '2' })).toBe(withQuery('/x', { a: '2', b: '1' }));
    expect(withQuery('/x', {})).toBe('/x');
  });

  it('reads a page number from the address, falling back to 1', () => {
    expect(pageNumber('3')).toBe(3);
    expect(pageNumber(null)).toBe(1);
    expect(pageNumber('0')).toBe(1);
    expect(pageNumber('2.5')).toBe(1);
    expect(pageNumber('abc')).toBe(1);
  });

  it('passes on only the filters a list takes', () => {
    expect(
      pick(new URLSearchParams('status=draft&evil=1&page=2&q='), ['status', 'page', 'q']),
    ).toEqual({ status: 'draft', page: '2' });
  });

  it('shows the first, the last and the pages around the current one', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });
});

describe('uploads (Document 3, section 10)', () => {
  it('says at once when a document is too large or of a type the backend refuses', () => {
    expect(checkFile({ size: 5 * 1024 * 1024 + 1, type: 'application/pdf' }, 'document')).toBe(
      'FILE_TOO_LARGE',
    );
    expect(checkFile({ size: 1000, type: 'image/gif' }, 'document')).toBe('FILE_TYPE_NOT_ALLOWED');
    expect(checkFile({ size: 1000, type: 'application/pdf' }, 'document')).toBeNull();
    expect(checkFile({ size: 9 * 1024 * 1024, type: 'image/webp' }, 'photo')).toBeNull();
  });

  it('leaves a file whose type the browser cannot tell to the backend', () => {
    expect(checkFile({ size: 1000, type: '' }, 'document')).toBeNull();
  });

  it('shows sizes as people read them', () => {
    expect(formatSize(2.4 * 1024 * 1024)).toBe('2.4 MB');
    expect(formatSize(300)).toBe('1 KB');
  });
});

describe('a streamed upload is sent once (Document 3, section 10)', () => {
  const token = (exp: number) =>
    `x.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.y`;
  it('renews the login first when the access token is about to expire', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(expiresWithin(token(now + 30), 60)).toBe(true);
    expect(expiresWithin(token(now + 3600), 60)).toBe(false);
    expect(expiresWithin('not-a-token', 60)).toBe(true);
  });
});
