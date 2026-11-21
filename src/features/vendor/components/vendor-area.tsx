import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AreaShell } from '@/features/layout/components/area-shell';
import { StaffArea, vendorNav } from '@/features/layout/menus';
import { getMessages, VENDOR_AREA_SECTIONS } from '@/lib/messages';
import { vendorApplyPath } from '@/lib/routes';
import { requireUser, Unavailable } from '@/features/auth/components/require-user';
import { lookUpVendor, VendorPresence } from '@/features/vendor/server/vendor-presence';
import { ReadOnlyBanner } from './read-only-banner';

/**
 * Who may open the Vendor area (Document 5, section 4): the application page is open to any
 * logged-in person; every other vendor page needs a vendor in any status, and a person with no
 * vendor is sent to the application page. Those other pages show the one read-only banner when the
 * vendor is not approved (section 7.5).
 */
export async function VendorArea({
  langParam,
  needsVendor,
  children,
}: {
  langParam: string;
  needsVendor: boolean;
  children: ReactNode;
}) {
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { lang, token } = result;

  const vendor = await lookUpVendor(token);
  if (vendor.presence === VendorPresence.Unknown) return <Unavailable lang={lang} />;

  const hasVendor = vendor.presence === VendorPresence.Exists;
  if (needsVendor && !hasVendor) redirect(vendorApplyPath(lang));

  const messages = getMessages(lang);
  return (
    <AreaShell
      lang={lang}
      area={StaffArea.Vendor}
      nav={vendorNav(lang, messages, hasVendor)}
      sections={VENDOR_AREA_SECTIONS}
    >
      {needsVendor && vendor.status ? (
        <ReadOnlyBanner lang={lang} status={vendor.status} messages={messages} />
      ) : null}
      {children}
    </AreaShell>
  );
}
