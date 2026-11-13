import { notFound } from 'next/navigation';
import { ProductList } from '@/features/product/components/product-list';
import { isLocale } from '@/lib/i18n';

/** My products (Document 5, section 7.3). Who may enter: the Vendor area layout. */
export default async function ProductsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ProductList lang={lang} />;
}
