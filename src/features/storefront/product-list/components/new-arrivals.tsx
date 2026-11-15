'use client';

import { LoadingBlock, PartError } from '@/components/common/load-states';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { useNewArrivals } from '@/features/storefront/product-list/hooks/use-product-list';
import type { ProductCardData } from '@/features/storefront/product-list/types';
import { ProductCard } from './product-card';

/**
 * New arrivals on the home page (Document 5, D5-12; Document 6, 7.4): the newest products from the
 * product list sorted by newest, in standard cards with nothing added, and no "View all" link. If
 * they could not be read, this part says so with "Try again" and the rest of the home page stays
 * usable (Document 5, section 3). With no products the section is not shown.
 */
export function NewArrivals({
  lang,
  drawn,
  limit,
}: {
  lang: Locale;
  /** The cards the server drew, or null when it could not read them. */
  drawn: ProductCardData[] | null;
  limit: number;
}) {
  const messages = useMessages();
  const storeMessages = messages.store;
  const newArrivals = useNewArrivals(drawn, limit);
  if (newArrivals.isSuccess && !newArrivals.data.length) return null;
  return (
    <section aria-labelledby="new-arrivals" className="grid gap-4">
      <h2 id="new-arrivals" className="type-h2 text-ink">
        {storeMessages.newArrivals}
      </h2>
      {newArrivals.isPending ? <LoadingBlock messages={messages} lines={2} /> : null}
      {newArrivals.isError ? (
        <PartError
          error={newArrivals.error}
          title={storeMessages.newArrivalsError}
          onRetry={() => void newArrivals.refetch()}
          messages={messages}
        />
      ) : null}
      {newArrivals.isSuccess ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
          {newArrivals.data.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} lang={lang} messages={messages} isEager={index < 2} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
