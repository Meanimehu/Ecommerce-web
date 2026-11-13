import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ProductEditor } from '@/features/product/components/product-editor';

/** Add a product: the first step creates the draft (Document 5, section 7.3). */
export default async function AddProductPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ProductEditor lang={lang} id={null} />;
}
