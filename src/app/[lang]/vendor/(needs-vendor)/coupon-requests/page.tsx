import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { MyRequestList } from '@/features/coupon/components/my-request-list';

/** The vendor's coupon requests (Document 5, section 8.2). Who may enter: the vendor area layout. */
export default async function CouponRequestsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <MyRequestList lang={lang} />;
}
