import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { ProductAttention } from '@/features/product/components/product-attention';
import { StockAttention } from '@/features/stock/components/stock-attention';
import { ApplicationSummary } from '@/features/vendor/components/application-summary';

/**
 * Vendor home (Document 5, section 7.2; approved Stage 5): the application's status, then what
 * needs attention, built only from what the backend already sends: products waiting for review,
 * rejected products, variants low on stock and out of stock. No chart. Each part comes from its
 * own feature and loads, or fails, on its own; this page only places them (Document 7, 20.4).
 * Coupon requests are on hold (Document 8, Slice 4 notes), so they have no line here.
 */
export default async function VendorHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = getMessages(lang);
  return (
    <div className="grid max-w-[960px] gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{messages.areas.vendorHome}</h1>
      <ApplicationSummary lang={lang} />
      <section aria-labelledby="attention-heading" className="grid gap-3">
        <h2 id="attention-heading" className="type-h3 text-ink">
          {messages.vendor.home.attention}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ProductAttention lang={lang} />
          <StockAttention lang={lang} />
        </div>
      </section>
    </div>
  );
}
