'use client';

import type { Messages } from '@/lib/i18n';
import { Select } from '@/components/ui/select';
import type { ListFiltersControl } from '@/features/storefront/product-list/hooks/use-list-filters';
import { ProductSort } from '@/features/storefront/product-list/rules';

/** The words for each order. */
export const sortLabel = (sort: ProductSort, messages: Messages) =>
  ({
    [ProductSort.Newest]: messages.store.sortNewest,
    [ProductSort.PriceLowToHigh]: messages.store.sortPriceLow,
    [ProductSort.PriceHighToLow]: messages.store.sortPriceHigh,
    [ProductSort.BestMatch]: messages.store.sortBestMatch,
  })[sort];

/**
 * "Sort" (approved Stage 5 screens): the browser's own list. The first order is the list's default,
 * which the address leaves out.
 */
export function SortChoice({
  control,
  sorts,
  id,
  messages,
}: {
  control: ListFiltersControl;
  /** The orders this list offers; the first is its default. */
  sorts: readonly ProductSort[];
  id: string;
  messages: Messages;
}) {
  const [defaultSort] = sorts;
  const value = control.filters.sort ?? defaultSort;
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="type-small text-ink-2">
        {messages.store.sortBy}
      </label>
      <Select
        id={id}
        value={value}
        className="w-auto"
        onChange={(event) => {
          const chosen = sorts.find((sort) => sort === event.target.value) ?? null;
          control.setSort(chosen === defaultSort ? null : chosen);
        }}
      >
        {sorts.map((sort) => (
          <option key={sort} value={sort}>
            {sortLabel(sort, messages)}
          </option>
        ))}
      </Select>
    </div>
  );
}
