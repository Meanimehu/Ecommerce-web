import { notFound } from 'next/navigation';
import { ProductEditor } from '@/components/product/product-editor';
import { isLocale } from '@/lib/i18n';

/** Add a product: the first step creates the draft (Document 5, section 7.3). */
export default async function NewProductPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ProductEditor lang={lang} id={null} />;
}
