import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AreaShell } from '@/features/layout/components/area-shell';
import { StaffArea, vendorNav } from '@/features/layout/menus';
import { getMessages } from '@/lib/messages';
import { vendorApplyPath } from '@/lib/routes';
import { requireUser, Unavailable } from '@/features/auth/components/require-user';
import { findVendorPresence, VendorPresence } from '@/features/vendor/server/vendor-presence';

/**
 * Who may open the Vendor area (Document 5, section 4): the application page is open to any
 * logged-in person; every other vendor page needs a vendor in any status, and a person with no
 * vendor is sent to the application page.
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

  const vendorPresence = await findVendorPresence(token);
  if (vendorPresence === VendorPresence.Unknown) return <Unavailable lang={lang} />;

  const hasVendor = vendorPresence === VendorPresence.Exists;
  if (needsVendor && !hasVendor) redirect(vendorApplyPath(lang));

  return (
    <AreaShell lang={lang} area={StaffArea.Vendor} nav={vendorNav(lang, getMessages(lang), hasVendor)}>
      {children}
    </AreaShell>
  );
}
