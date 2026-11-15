'use client';

import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { withQuery } from '@/utils/url';
import {
  listSearch,
  withoutFilters,
  withToggled,
  type FilterGroup,
  type ListFilters,
  type ProductSort,
} from '@/features/storefront/product-list/rules';

/**
 * A list's filters and sort live in its address (Document 5, section 6.1): each change opens the
 * same list with the new address, so a link can be shared and Back goes to the choice before. The
 * server draws the first batch again, which also starts "Load more" over. While it does, the list
 * shows it is busy; the page does not jump to the top, and focus stays on the control used. The
 * controls show the new choice at once, and a second change made meanwhile builds on it.
 */
export function useListFilters({ filters, path }: { filters: ListFilters; path: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(filters);

  function open(next: ListFilters) {
    startTransition(() => {
      setShown(next);
      router.push(withQuery(path, listSearch(next)), { scroll: false });
    });
  }

  return {
    filters: shown,
    isPending,
    toggle: (group: FilterGroup, value: string) => open(withToggled(shown, group, value)),
    setPrice: (minRupees: number | null, maxRupees: number | null) =>
      open({ ...shown, minRupees, maxRupees }),
    setSort: (sort: ProductSort | null) => open({ ...shown, sort }),
    clearAll: () => open(withoutFilters(shown)),
  };
}

export type ListFiltersControl = ReturnType<typeof useListFilters>;
