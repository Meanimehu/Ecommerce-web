'use client';

import { useEffect, useRef, useState } from 'react';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { Page } from '@/types/common';
import type { Query } from '@/utils/url';
import type { ProductCardData } from '@/features/storefront/types';
import { useProductCards } from './use-storefront';

/**
 * "Load more" (Document 5, section 6.1; Document 6, 8.8): the cards shown so far, each once even if
 * the list moved between batches; "Showing 8 of 128"; and, after each batch, how many were added,
 * for screen readers. A failure shows inside the grid, and the button then reads "Try again". The
 * screen, `product-grid.tsx`, only draws.
 *
 * Focus stays where it was: the button is switched off while a batch loads, which takes focus
 * away, so when the button had focus it gets it back; once the last batch is in and the button is
 * gone, focus moves to the first card added (Document 6, 8.8).
 */
export function useProductGrid({
  firstBatch,
  query,
}: {
  firstBatch: Page<ProductCardData>;
  query: Query;
}) {
  const messages = useMessages();
  const productCards = useProductCards(firstBatch, query);
  const [announcement, setAnnouncement] = useState('');
  const loadMoreButton = useRef<HTMLButtonElement>(null);
  const firstAddedCard = useRef<HTMLAnchorElement>(null);
  const [firstAddedIndex, setFirstAddedIndex] = useState<number | null>(null);
  // Whether the button had focus when pressed, so focus is given back once the batch is in.
  const isFocusToRestore = useRef(false);
  const batches = productCards.data.pages;
  const cards = withoutRepeats(batches.flatMap((batch) => batch.items));
  const total = batches.at(-1)?.total ?? firstBatch.total;
  // A failure stays shown until the next try starts, as before.
  const loadError =
    productCards.isFetchNextPageError && !productCards.isFetchingNextPage
      ? productCards.error
      : null;

  const isLoading = productCards.isFetchingNextPage;
  const canLoadMore = cards.length < total;

  useEffect(() => {
    if (isLoading || !isFocusToRestore.current) return;
    isFocusToRestore.current = false;
    // More remain, or the try failed: the button is still there. Otherwise the first new card.
    if (canLoadMore) loadMoreButton.current?.focus();
    else firstAddedCard.current?.focus();
  }, [isLoading, canLoadMore]);

  function loadMore() {
    if (isLoading) return;
    const shownBefore = cards.length;
    isFocusToRestore.current = document.activeElement === loadMoreButton.current;
    setFirstAddedIndex(shownBefore);
    void productCards.fetchNextPage().then((result) => announceAdded(result, shownBefore));
  }

  // Said once each batch has arrived: how many more products are shown (Document 6, 8.8).
  function announceAdded(
    result: Awaited<ReturnType<typeof productCards.fetchNextPage>>,
    shownBefore: number,
  ) {
    if (result.isError) return;
    const batchesNow = result.data?.pages ?? [];
    const shownAfter = withoutRepeats(batchesNow.flatMap((batch) => batch.items)).length;
    setAnnouncement(fill(messages.store.added, { count: shownAfter - shownBefore }));
  }

  return {
    cards,
    total,
    canLoadMore,
    loadMore,
    isLoading,
    loadMoreButton,
    firstAddedCard,
    firstAddedIndex,
    loadErrorText: loadError ? messageFor(loadError, messages) : null,
    announcement,
  };
}

/** Each product once: a card that moved into a later batch is not shown again. */
function withoutRepeats(cards: ProductCardData[]): ProductCardData[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}
