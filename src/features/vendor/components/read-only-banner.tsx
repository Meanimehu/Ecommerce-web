import Link from 'next/link';
import { Banner } from '@/components/ui/banner';
import type { Locale, Messages } from '@/lib/i18n';
import { vendorApplyPath } from '@/lib/routes';
import { VendorStatus } from '@/features/vendor/types';

/**
 * The one banner a vendor that is not approved sees on every Vendor area page except the
 * application (Document 5, section 7.5; approved Stage 5): it says the pages can be read but not
 * changed, and links to the application, where the status and any reason are. Each screen also hides
 * its change buttons, and still handles the backend's refusal if the status changed meanwhile.
 */
export function ReadOnlyBanner({
  lang,
  status,
  messages,
}: {
  lang: Locale;
  status: VendorStatus;
  messages: Messages;
}) {
  if (status === VendorStatus.Approved) return null;
  const readOnly = messages.vendor.readOnly;
  return (
    <Banner
      tone="warning"
      className="mb-5"
      action={
        <Link
          href={vendorApplyPath(lang)}
          className="type-small font-medium text-ink underline underline-offset-4"
        >
          {readOnly.seeApplication}
        </Link>
      }
    >
      {status === VendorStatus.Suspended ? readOnly.suspended : readOnly.notApproved}
    </Banner>
  );
}
