import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { MyRequestPage } from '@/features/coupon/components/my-request-page';

/** One coupon request with its history (Document 5, section 8.2). */
export default async function CouponRequestPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  return <MyRequestPage lang={lang} id={id} />;
}
