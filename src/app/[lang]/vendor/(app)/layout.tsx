import type { ReactNode } from 'react';
import { VendorArea } from '@/components/vendor/vendor-area';

/** Every vendor page except the application: needs a vendor in any status (Document 5, section 4). */
export default async function VendorPagesLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <VendorArea langParam={lang} needsVendor>
      {children}
    </VendorArea>
  );
}
