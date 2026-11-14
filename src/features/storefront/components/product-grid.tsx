'use client';

import { Button } from '@/components/ui/button';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { Page } from '@/types/common';
import type { Query } from '@/utils/url';
import { useProductGrid } from '@/features/storefront/hooks/use-product-grid';
import type { ProductCardData } from '@/features/storefront/types';
import { ProductCard } from './product-card';

/** The first cards load at once; the rest when they come into view. */
const EAGER_CARDS = 4;

/**
 * A category's products with "Load more" (Document 5, section 6.1; Document 6, 8.8): the first
 * batch comes drawn from the server, each further batch is added below. "Showing 8 of 128" with a
 * thin progress line; the number added is announced. A failure shows inside this part with "Try
 * again". Focus stays where it was (Document 6, 8.8). It only draws; the batches and the focus are in
 * `use-product-grid.ts`.
 */
export function ProductGrid({
  lang,
  firstBatch,
  query,
}: {
  lang: Locale;
  firstBatch: Page<ProductCardData>;
  query: Query;
}) {
  const messages = useMessages();
  const storeMessages = messages.store;
  const { loadMoreButton, firstAddedCard, ...productGrid } = useProductGrid({ firstBatch, query });
  const { cards, total } = productGrid;

  return (
    <div className="grid gap-6">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {cards.map((product, index) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              lang={lang}
              messages={messages}
              isEager={index < EAGER_CARDS}
              ref={index === productGrid.firstAddedIndex ? firstAddedCard : undefined}
            />
          </li>
        ))}
      </ul>
      <p role="status" className="sr-only">
        {productGrid.announcement}
      </p>
      {productGrid.canLoadMore ? (
        <div className="grid justify-items-center gap-3">
          <p className="type-small text-ink-2">
            {fill(storeMessages.showing, { shown: cards.length, total })}
          </p>
          <div className="h-0.5 w-full max-w-[240px] overflow-hidden bg-line" aria-hidden="true">
            <div
              className="h-full bg-ink"
              style={{ width: `${Math.round((cards.length / total) * 100)}%` }}
            />
          </div>
          {productGrid.loadErrorText ? (
            <p role="alert" className="type-small text-error">
              {productGrid.loadErrorText}
            </p>
          ) : null}
          <Button
            ref={loadMoreButton}
            type="button"
            variant="secondary"
            size="large"
            loading={productGrid.isLoading}
            onClick={productGrid.loadMore}
          >
            {productGrid.loadErrorText ? messages.errors.tryAgain : storeMessages.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
