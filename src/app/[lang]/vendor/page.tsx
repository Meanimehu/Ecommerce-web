import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/** Vendor home (Document 5, section 7.2). Its content arrives with the vendor screens from Slice 2. */
export default async function VendorHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{t.areas.vendorHome}</h1>
      <p>{t.areas.vendorIntro}</p>
    </div>
  );
}
