import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ProductEditor } from '@/features/product/components/product-editor';

/**
 * One product: its steps while it can be changed, otherwise what it holds (Document 5, section
 * 7.3).
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  return <ProductEditor lang={lang} id={id} />;
}
