import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import type { Locale } from './i18n';

/**
 * The message catalogue: one file per language, the same keys in both (Document 4, section 6). Screens never hold text
 * of their own (Document 1, D-08). `npm run check:messages` fails when the two files differ in keys.
 */
export type Messages = typeof en;

const catalogues: Record<Locale, Messages> = { en, hi };

export function getMessages(locale: Locale): Messages {
  return catalogues[locale];
}
