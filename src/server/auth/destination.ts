import type { Locale } from '@/lib/i18n';
import { isStaff } from '@/schemas/auth';

/** Where a person goes after login when they asked for no page (Document 2, D2-03). */
export function defaultDestination(roles: readonly string[], lang: Locale): string {
  if (isStaff(roles)) return `/${lang}/admin`;
  if (roles.includes('vendor_owner')) return `/${lang}/vendor`;
  return `/${lang}`;
}
