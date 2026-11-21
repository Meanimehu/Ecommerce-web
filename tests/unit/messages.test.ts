import { describe, expect, it } from 'vitest';
import { compareCatalogues } from '../../scripts/message-checks';
import { GLOBAL_ERROR_TEXT } from '@/lib/global-error-text';
import { ADMIN_SCREEN_SECTIONS, AREA_SECTIONS, VENDOR_AREA_SECTIONS } from '@/lib/messages';
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';

describe('message catalogues (Document 4, section 6)', () => {
  it('English and Hindi have the same keys and no empty text', () => {
    expect(compareCatalogues(['en', 'hi'], en, hi)).toEqual([]);
  });
  it('carries the two failure messages of D7-10 word for word', () => {
    expect(en.errors.viewTimeout).toBe('Something went wrong. Please try again.');
    expect(en.errors.saveTimeout).toBe(
      "We couldn't confirm your change. Please check before trying again.",
    );
  });
  it('reports a missing key, an empty text and a non-text value', () => {
    const problems = compareCatalogues(['a', 'b'], { x: 'X', y: '', n: 1 }, { x: 'X' });
    expect(problems).toEqual(
      expect.arrayContaining([
        { key: 'y', problem: 'empty text in a' },
        { key: 'n', problem: 'not text or a group in a' },
        { key: 'y', problem: 'missing in b' },
      ]),
    );
  });
});

describe('the last-resort error page (src/app/global-error.tsx)', () => {
  it('uses the English catalogue’s words, copied so the catalogue stays off every page', () => {
    expect(GLOBAL_ERROR_TEXT).toEqual({
      title: en.errorPage.title,
      body: en.errorPage.body,
      tryAgain: en.errors.tryAgain,
    });
  });
});

describe('the staff areas’ own text (Document 6, section 14)', () => {
  it('gives every area-only section to the Vendor area or to an Admin screen', () => {
    const given = new Set<string>([
      ...VENDOR_AREA_SECTIONS,
      ...Object.values(ADMIN_SCREEN_SECTIONS).flat(),
    ]);
    expect(AREA_SECTIONS.filter((section) => !given.has(section))).toEqual([]);
  });
  it('keeps the admin-only text off the Vendor area', () => {
    const vendorArea: readonly string[] = VENDOR_AREA_SECTIONS;
    for (const adminOnly of ['adminVendors', 'moderation', 'users']) {
      expect(vendorArea).not.toContain(adminOnly);
    }
  });
});
