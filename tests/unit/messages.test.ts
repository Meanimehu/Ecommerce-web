import { describe, expect, it } from 'vitest';
import { compareCatalogues } from '../../scripts/message-checks';
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
