import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AreaShell } from '@/features/auth/area-shell';
import { requireUser } from '@/features/auth/require-user';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Vendor area. Slice 1 lets in holders of the vendor_owner role (an approved vendor). Slice 2 replaces this with the
 * Document 5, section 4 rule, which needs the vendor application (Area 2): anyone with a vendor in any status, the
 * application page for any logged-in person, and a person with no vendor sent to the application page.
 */
export default async function VendorLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, `/${param}/vendor`, (user) => user.roles.includes('vendor_owner'));
  if ('render' in result) return result.render;
  return (
    <AreaShell lang={result.lang} area="vendor">
      {children}
    </AreaShell>
  );
}
