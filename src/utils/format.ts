import type { Locale } from '@/lib/i18n';

/** How dates, money and phone numbers are shown (Document 6, section 16). One place for each. */

/**
 * Dates and times in IST (D-16; Document 6, section 16): "5 Nov 2026" / "5 नवंबर 2026", 12-hour times "2:30 pm".
 * The backend sends ISO 8601 in UTC.
 */
const IST = 'Asia/Kolkata';

const dateFormats: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' }),
  hi: new Intl.DateTimeFormat('hi-IN-u-nu-latn', { timeZone: IST, day: 'numeric', month: 'long', year: 'numeric' }),
};

const timeFormats: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-IN-u-nu-latn', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true }),
  hi: new Intl.DateTimeFormat('hi-IN-u-nu-latn', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true, dayPeriod: 'short' }),
};

export function formatDate(iso: string, locale: Locale): string {
  return dateFormats[locale].format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  const text = timeFormats[locale].format(new Date(iso));
  return locale === 'en' ? text.replace(/\s?(AM|PM)$/i, (m) => ` ${m.trim().toLowerCase()}`) : text;
}

/**
 * Money (Document 3, section 7; Document 6, section 16). The backend sends whole paise. Amounts stay whole numbers;
 * they are turned into text only for display. Rupee sign, Indian grouping, Latin digits; whole rupees without decimals,
 * otherwise two decimals (₹1,499 and ₹1,499.50).
 */
const grouping = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0, useGrouping: true });

export function formatRupees(paise: number): string {
  if (!Number.isSafeInteger(paise)) throw new Error(`Money must be whole paise, got ${paise}`);
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}₹${grouping.format(rupees)}${rest === 0 ? '' : `.${String(rest).padStart(2, '0')}`}`;
}

/** Phone display (Document 6, section 16): the backend stores "+91" and ten digits; shown as "+91 98765 43210". */
export function formatPhone(phone: string): string {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : phone;
}

/** A GST rate: the backend sends whole basis points (1,200 is 12%). */
export function formatRate(bps: number): string {
  return `${bps / 100}%`;
}
