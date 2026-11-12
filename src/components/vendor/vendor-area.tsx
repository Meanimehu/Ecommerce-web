import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getMyVendor } from '@/api/vendor';
import { AreaShell } from '@/components/auth/area-shell';
import { vendorNav } from '@/components/auth/area-menus';
import { currentPath, requireUser, Unavailable } from '@/features/auth/components/require-user';
import { AppError } from '@/lib/errors';
import { getMessages } from '@/lib/messages';

/**
 * Who may open the Vendor area (Document 5, section 4): the application page is open to any logged-in person; every
 * other vendor page needs a vendor in any status, and a person with no vendor is sent to the application page. The
 * application is read from the backend (GET /vendors/me: 404 means no vendor).
 */
export async function VendorArea({ langParam, needsVendor, children }: { langParam: string; needsVendor: boolean; children: ReactNode }) {
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { lang, token } = result;
  const t = getMessages(lang);
  let hasVendor: boolean;
  try {
    await getMyVendor(token);
    hasVendor = true;
  } catch (error) {
    if (!(error instanceof AppError && error.code === 'VENDOR_NOT_FOUND')) {
      return <Unavailable lang={lang} path={await currentPath(lang)} />;
    }
    hasVendor = false;
  }
  if (needsVendor && !hasVendor) redirect(`/${lang}/vendor/apply`);
  return (
    <AreaShell lang={lang} area="vendor" nav={vendorNav(lang, t, hasVendor)}>
      {children}
    </AreaShell>
  );
}
