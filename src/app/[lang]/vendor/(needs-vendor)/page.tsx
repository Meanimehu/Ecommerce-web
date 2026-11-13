import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/**
 * Vendor home (Document 5, section 7.2). The needs-attention list arrives with the rest of the
 * vendor screens (Slice 4); until then it links to what is built.
 */
export default async function VendorHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = getMessages(lang);
  return (
    <div className="grid max-w-[72ch] gap-3">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{messages.areas.vendorHome}</h1>
      <p>{messages.areas.vendorIntro}</p>
      <ul className="grid gap-1">
        <li>
          <a
            className="inline-flex min-h-11 items-center underline underline-offset-4"
            href={`/${lang}/vendor/apply`}
          >
            {messages.nav.application}
          </a>
        </li>
      </ul>
    </div>
  );
}
