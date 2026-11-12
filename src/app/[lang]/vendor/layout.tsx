import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Vendor area: never indexed, always rendered for the person (Document 4, sections 7 and 8). Entry rules: VendorArea. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function VendorLayout({ children }: { children: ReactNode }) {
  return children;
}
