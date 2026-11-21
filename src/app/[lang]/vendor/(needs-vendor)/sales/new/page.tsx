import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { SaleForm } from '@/features/sales/components/sale-form';

/** A new sale (Document 5, section 8.2). Who may enter: the vendor area layout. */
export default async function NewSalePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SaleForm lang={lang} />;
}
