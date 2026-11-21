import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { BulkStock } from '@/features/stock/components/bulk-stock';

/** The bulk update by SKU (Document 5, section 7.4). Who may enter: the vendor area layout. */
export default async function BulkStockPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <BulkStock lang={lang} />;
}
