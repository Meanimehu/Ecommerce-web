import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { MyCouponList } from '@/features/coupon/components/my-coupon-list';

/** The coupons that charge the vendor (Document 5, section 8.2). Who may enter: the vendor area layout. */
export default async function VendorCouponsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <MyCouponList lang={lang} />;
}
