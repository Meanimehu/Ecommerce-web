import { describe, expect, it } from 'vitest';
import { localeOfPath, pickLocale } from '@/lib/i18n';

describe('pickLocale (Document 4, section 6)', () => {
  it('uses English when the browser says nothing', () => {
    expect(pickLocale(null)).toBe('en');
    expect(pickLocale('')).toBe('en');
  });
  it('uses Hindi when the browser prefers it', () => {
    expect(pickLocale('hi-IN,hi;q=0.9,en;q=0.8')).toBe('hi');
  });
  it('follows the quality order, not the written order', () => {
    expect(pickLocale('en;q=0.5,hi;q=0.9')).toBe('hi');
  });
  it('skips languages we do not offer', () => {
    expect(pickLocale('ta-IN,ta;q=0.9,hi;q=0.8')).toBe('hi');
    expect(pickLocale('fr,de')).toBe('en');
  });
  it('ignores languages marked q=0', () => {
    expect(pickLocale('hi;q=0,en;q=0.1')).toBe('en');
  });
});

describe('localeOfPath', () => {
  it('finds the prefix', () => {
    expect(localeOfPath('/hi/p/1/kurta')).toBe('hi');
    expect(localeOfPath('/en')).toBe('en');
  });
  it('returns null without a prefix', () => {
    expect(localeOfPath('/')).toBeNull();
    expect(localeOfPath('/english')).toBeNull();
  });
});
