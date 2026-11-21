import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { ImportList } from '@/features/product/components/import-list';

/** CSV import (Document 5, section 7.3). Who may enter: the vendor area layout. */
export default async function ImportsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <ImportList lang={lang} />;
}
