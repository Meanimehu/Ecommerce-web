import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ChangeRequestForm } from '@/features/coupon/components/request-form';

/** A change to a draft, or to a request whose changes were asked for (Document 5, section 8.2). */
export default async function ChangeCouponRequestPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  return <ChangeRequestForm lang={lang} id={id} />;
}
