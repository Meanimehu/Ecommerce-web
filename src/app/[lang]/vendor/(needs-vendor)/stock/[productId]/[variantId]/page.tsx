import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { StockChange } from '@/features/stock/components/stock-change';

/** Change one variant's stock (Document 5, section 7.4). Who may enter: the vendor area layout. */
export default async function VariantStockPage({
  params,
}: {
  params: Promise<{ lang: string; productId: string; variantId: string }>;
}) {
  const { lang, productId, variantId } = await params;
  if (!isLocale(lang)) notFound();
  return <StockChange lang={lang} productId={productId} variantId={variantId} />;
}
