import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { SaleList } from '@/features/sales/components/sale-list';

/** The vendor's sale prices (Document 5, section 8.2). Who may enter: the vendor area layout. */
export default async function SalesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SaleList lang={lang} />;
}
