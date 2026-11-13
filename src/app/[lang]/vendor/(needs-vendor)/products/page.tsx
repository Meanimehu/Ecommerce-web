import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ProductList } from '@/features/product/components/product-list';

/** My products (Document 5, section 7.3). Who may enter: the vendor area layout. */
export default async function ProductsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ProductList lang={lang} />;
}
