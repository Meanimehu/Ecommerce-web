'use client';

import { useState, type ReactNode } from 'react';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { cn } from '@/utils/cn';
import { withQuery, type Query } from '@/utils/url';
import { Button } from '@/components/ui/button';
import { useListFilters } from '@/features/storefront/product-list/hooks/use-list-filters';
import {
  activeFilterCount,
  type FilterGroup,
  type ListFilters,
  type ProductSort,
} from '@/features/storefront/product-list/rules';
import type { ProductList } from '@/features/storefront/product-list/types';
import { ActiveFilters } from './active-filters';
import { FilterGroups } from './filter-groups';
import { FilterSheet } from './filter-sheet';
import { ProductGrid } from './product-grid';
import { SortChoice } from './sort-choice';

/**
 * A list of products with its filters and sort (Document 5, section 6.1; Document 6, 8.8; the
 * approved Stage 5 screens), shared by the category, brand and search pages: the filters in a 264
 * px side panel on wide screens and in a sheet on narrow ones, the sort, the chosen filters as
 * chips, and the grid with "Load more". The first batch comes drawn from the server for the
 * filters in the address; a change opens the new address (`use-list-filters.ts`). While the new
 * list loads, the grid is marked busy, and once it is in its count is announced.
 */
export function FilteredList({
  lang,
  path,
  filters,
  firstBatch,
  query,
  sorts,
  hiddenGroups,
  fixedQuery,
  emptyText,
  browseLinks,
}: {
  lang: Locale;
  /** The list's own address, without filters. */
  path: string;
  filters: ListFilters;
  firstBatch: ProductList;
  /** The backend query the first batch was read with, for "Load more". */
  query: Query;
  /** The orders this list offers; the first is its default. */
  sorts: readonly ProductSort[];
  hiddenGroups?: readonly FilterGroup[];
  /** Address values that stay whatever the filters, such as the search text. */
  fixedQuery?: Record<string, string>;
  /** What to say when the list has no products and no filter is on. */
  emptyText: string;
  /** Links to browse on when the list is empty or nothing matches (the search page shows categories). */
  browseLinks?: ReactNode;
}) {
  const messages = useMessages();
  const storeMessages = messages.store;
  const control = useListFilters({ filters, path, fixedQuery });
  // The list's count is said only after a change, not when the page opens (the heading shows it).
  const queryKey = withQuery('', query);
  const [firstQueryKey] = useState(queryKey);
  const hasChanged = queryKey !== firstQueryKey;
  const { facets, total } = firstBatch;
  const hasFilters = activeFilterCount(control.filters) > 0;
  const countText = total === 1 ? storeMessages.productsOne : storeMessages.productsMany;

  if (!total && !hasFilters) {
    return (
      <div className="grid justify-items-center gap-3 rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center">
        <p className="text-ink-2">{emptyText}</p>
        {browseLinks}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:items-start lg:gap-8">
      <aside aria-label={storeMessages.filters} className="max-lg:hidden">
        <h2 className="type-h3 text-ink">{storeMessages.filters}</h2>
        <FilterGroups
          control={control}
          facets={facets}
          hiddenGroups={hiddenGroups}
          idPrefix="panel"
          messages={messages}
        />
      </aside>
      <div className="grid min-w-0 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterSheet
            control={control}
            facets={facets}
            hiddenGroups={hiddenGroups}
            total={total}
            messages={messages}
          />
          <SortChoice control={control} sorts={sorts} id="list-sort" messages={messages} />
        </div>
        <ActiveFilters control={control} facets={facets} messages={messages} />
        {/* Said once a change has loaded: how many products the list now has. */}
        <p role="status" className="sr-only">
          {hasChanged && !control.isPending ? fill(countText, { count: total }) : ''}
        </p>
        <div
          aria-busy={control.isPending}
          className={cn('transition-opacity', control.isPending && 'opacity-60')}
        >
          {total ? (
            <ProductGrid key={queryKey} lang={lang} firstBatch={firstBatch} query={query} />
          ) : (
            <div className="grid justify-items-center gap-3 rounded-1 border border-dashed border-control bg-surface px-6 py-10 text-center">
              <p className="type-h3 text-ink">{storeMessages.noMatches}</p>
              <p className="text-ink-2">{storeMessages.noMatchesText}</p>
              <Button type="button" variant="secondary" onClick={control.clearAll}>
                {storeMessages.clearAllFilters}
              </Button>
              {browseLinks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
