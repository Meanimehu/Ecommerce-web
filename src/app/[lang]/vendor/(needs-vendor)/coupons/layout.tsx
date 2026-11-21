import type { ReactNode } from 'react';
import { VENDOR_SCREEN_SECTIONS } from '@/lib/messages';
import { ScreenText } from '@/features/layout/components/screen-text';

/** The text of the vendor coupon screens only (lib/messages.ts, VENDOR_SCREEN_SECTIONS). */
export default async function VendorCouponsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <ScreenText langParam={lang} sections={VENDOR_SCREEN_SECTIONS.coupons}>
      {children}
    </ScreenText>
  );
}
