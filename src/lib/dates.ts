import type { Locale } from './i18n';

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
