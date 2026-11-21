import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ImportView } from '@/features/product/components/import-view';

/** One CSV import: its check, and after confirm each product's result (Document 5, 7.3 and 11). */
export default async function ImportPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  return <ImportView lang={lang} id={id} />;
}
