import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { BusinessProfile } from '@/features/vendor/components/business-profile';

/** The business profile (Document 5, section 8.2). Who may enter: the vendor area layout. */
export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <BusinessProfile />;
}
