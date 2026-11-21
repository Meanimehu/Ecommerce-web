import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { NewRequestForm } from '@/features/coupon/components/request-form';

/**
 * A new coupon request (Document 5, section 8.2). The vendor area layout lets any vendor in; the
 * backend refuses a vendor that is not approved, and the list offers the button only to approved
 * ones.
 */
export default async function NewCouponRequestPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <NewRequestForm lang={lang} />;
}
