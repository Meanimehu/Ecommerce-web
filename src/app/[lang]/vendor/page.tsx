import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';

/** Vendor home (Document 5, section 7.2). Its content arrives with the vendor screens from Slice 2. */
export default async function VendorHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <div className="grid max-w-[72ch] gap-2">
      <h1 className="type-h2 text-ink stitch-bottom pb-3">{t.areas.vendorHome}</h1>
      <p>{t.areas.vendorIntro}</p>
    </div>
  );
}
