import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { StockScreen } from '@/features/stock/components/stock-screen';

/** The vendor's stock (Document 5, section 7.4). Who may enter: the vendor area layout. */
export default async function StockPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <StockScreen lang={lang} />;
}
