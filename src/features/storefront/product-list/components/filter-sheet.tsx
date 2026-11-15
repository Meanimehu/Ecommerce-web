'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import type { ListFiltersControl } from '@/features/storefront/product-list/hooks/use-list-filters';
import { activeFilterCount, type FilterGroup } from '@/features/storefront/product-list/rules';
import type { Facets } from '@/features/storefront/product-list/types';
import { FilterGroups } from './filter-groups';

/**
 * The filters on compact and medium screens (Document 6, 8.8; Document 5, section 6.1): a "Filters"
 * button with the number of filters on, which opens a full-height sheet. Each choice applies at
 * once; "Show N results" at the foot of the sheet (part of the sheet, not a bar on the page) closes
 * it on the updated list. Escape and the close button close it too, and focus goes back to the
 * button.
 */
export function FilterSheet({
  control,
  facets,
  hiddenGroups,
  total,
  messages,
}: {
  control: ListFiltersControl;
  facets: Facets;
  hiddenGroups?: readonly FilterGroup[];
  total: number;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const [isOpen, setIsOpen] = useState(false);
  const count = activeFilterCount(control.filters);
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button type="button" variant="secondary" className="lg:hidden">
          <SlidersHorizontal aria-hidden="true" />
          {count ? fill(storeMessages.filtersWithCount, { count }) : storeMessages.filters}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 grid grid-rows-[auto_1fr_auto] bg-surface outline-none lg:hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <DialogPrimitive.Title className="type-h3 text-ink">
              {storeMessages.filters}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="inline-flex size-11 items-center justify-center rounded-2 text-ink transition-colors duration-100 hover:bg-sunken">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{storeMessages.closeFilters}</span>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {storeMessages.filters}
          </DialogPrimitive.Description>
          <div className="overflow-y-auto px-4" aria-busy={control.isPending}>
            <FilterGroups
              control={control}
              facets={facets}
              hiddenGroups={hiddenGroups}
              idPrefix="sheet"
              messages={messages}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <Button type="button" variant="quiet" onClick={control.clearAll} disabled={!count}>
              {storeMessages.clearAll}
            </Button>
            <Button type="button" loading={control.isPending} onClick={() => setIsOpen(false)}>
              {total === 1
                ? storeMessages.showResultsOne
                : fill(storeMessages.showResults, { count: total })}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
