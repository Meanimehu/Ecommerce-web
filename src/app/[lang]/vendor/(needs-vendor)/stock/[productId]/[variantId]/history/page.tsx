import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { StockHistory } from '@/features/stock/components/stock-history';

/** One variant's stock history (Document 5, section 7.4). Who may enter: the vendor area layout. */
export default async function StockHistoryPage({
  params,
}: {
  params: Promise<{ lang: string; productId: string; variantId: string }>;
}) {
  const { lang, productId, variantId } = await params;
  if (!isLocale(lang)) notFound();
  return <StockHistory lang={lang} productId={productId} variantId={variantId} />;
}
