import type { Locale, Messages } from '@/lib/i18n';
import { adminHomePath, vendorApplyPath, vendorHomePath } from '@/lib/routes';
import { VendorPresence } from '@/features/vendor/server/vendor-presence';

/**
 * The areas this person may enter (Document 2, D2-03): the Admin area for staff, the Vendor area
 * for a person with a vendor in any status, and "Become a vendor" for a person with none (D5-10).
 * If the backend could not say whether there is a vendor, neither vendor link is shown rather than
 * a wrong one.
 */
export function AccountAreas({
  lang,
  isStaff,
  vendorPresence,
  messages,
}: {
  lang: Locale;
  isStaff: boolean;
  vendorPresence: VendorPresence;
  messages: Messages;
}) {
  const areas = [
    ...(isStaff ? [{ href: adminHomePath(lang), label: messages.nav.adminArea }] : []),
    ...(vendorPresence === VendorPresence.Exists
      ? [{ href: vendorHomePath(lang), label: messages.nav.vendorArea }]
      : []),
    ...(vendorPresence === VendorPresence.None
      ? [{ href: vendorApplyPath(lang), label: messages.nav.becomeVendor }]
      : []),
  ];
  if (!areas.length) return null;
  return (
    <nav
      aria-labelledby="areas-heading"
      className="grid gap-2 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="areas-heading" className="type-label text-ink">
        {messages.account.areas}
      </h2>
      <ul className="grid">
        {areas.map((area) => (
          <li key={area.href}>
            <a
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-madder-hover"
              href={area.href}
            >
              {area.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
