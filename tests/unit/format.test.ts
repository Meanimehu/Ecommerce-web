import { describe, expect, it } from 'vitest';
import { formatDate, formatPhone, formatRupees, formatTime } from '@/utils/format';

describe('formatRupees (Document 6, section 16)', () => {
  it('uses the rupee sign and Indian grouping, without decimals for whole rupees', () => {
    expect(formatRupees(149900)).toBe('₹1,499');
    expect(formatRupees(21999900)).toBe('₹2,19,999');
    expect(formatRupees(0)).toBe('₹0');
  });
  it('shows paise with two decimals', () => {
    expect(formatRupees(149950)).toBe('₹1,499.50');
    expect(formatRupees(105)).toBe('₹1.05');
  });
  it('refuses anything that is not whole paise', () => {
    expect(() => formatRupees(10.5)).toThrow();
  });
});

describe('dates in IST', () => {
  // 2026-11-05T09:00:00Z is 2:30 pm on 5 Nov in India.
  const iso = '2026-11-05T09:00:00Z';
  it('formats the date', () => {
    expect(formatDate(iso, 'en')).toBe('5 Nov 2026');
    expect(formatDate(iso, 'hi')).toBe('5 नवंबर 2026');
  });
  it('uses IST even near midnight UTC', () => {
    expect(formatDate('2026-11-05T20:00:00Z', 'en')).toBe('6 Nov 2026');
  });
  it('formats the time on a 12-hour clock', () => {
    expect(formatTime(iso, 'en')).toBe('2:30 pm');
    expect(formatTime(iso, 'hi')).toMatch(/2:30/);
  });
});

describe('formatPhone', () => {
  it('groups the ten digits', () => {
    expect(formatPhone('+919876543210')).toBe('+91 98765 43210');
  });
  it('leaves anything else as it is', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});
