'use client';

import { X } from 'lucide-react';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { formatRupees } from '@/utils/format';
import { Button } from '@/components/ui/button';
import type { ListFiltersControl } from '@/features/storefront/product-list/hooks/use-list-filters';
import { activeFilterCount, FilterGroup } from '@/features/storefront/product-list/rules';
import type { Facets } from '@/features/storefront/product-list/types';

const PAISE_PER_RUPEE = 100;

/**
 * The chosen filters as removable chips above the grid, with "Clear all" (Document 6, 8.8): a
 * selected chip has an ink fill. Each chip is a button that removes that filter.
 */
export function ActiveFilters({
  control,
  facets,
  messages,
}: {
  control: ListFiltersControl;
  facets: Facets;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const { filters } = control;
  if (!activeFilterCount(filters)) return null;
  const labelOf = (options: { value: string; label: string }[], value: string) =>
    options.find((option) => option.value === value)?.label ?? value;
  const rupees = (amount: number) => formatRupees(amount * PAISE_PER_RUPEE);

  const chips = [
    ...filters.sizes.map((code) => ({
      key: `size-${code}`,
      label: `${storeMessages.size} ${labelOf(
        facets.sizes.map((size) => ({ value: size.code, label: size.label })),
        code,
      )}`,
      remove: () => control.toggle(FilterGroup.Size, code),
    })),
    ...filters.colours.map((code) => ({
      key: `colour-${code}`,
      label: labelOf(
        facets.colours.map((colour) => ({ value: colour.code, label: colour.label })),
        code,
      ),
      remove: () => control.toggle(FilterGroup.Colour, code),
    })),
    ...(filters.minRupees !== null || filters.maxRupees !== null
      ? [{ key: 'price', label: priceText(), remove: () => control.setPrice(null, null) }]
      : []),
    ...filters.brandIds.map((id) => ({
      key: `brand-${id}`,
      label: labelOf(
        facets.brands.map((brand) => ({ value: brand.id, label: brand.name })),
        id,
      ),
      remove: () => control.toggle(FilterGroup.Brand, id),
    })),
  ];

  function priceText() {
    const { minRupees, maxRupees } = filters;
    if (minRupees !== null && maxRupees !== null) {
      return fill(storeMessages.priceRange, { min: rupees(minRupees), max: rupees(maxRupees) });
    }
    if (minRupees !== null) return fill(storeMessages.priceFrom, { min: rupees(minRupees) });
    return fill(storeMessages.priceUpTo, { max: rupees(maxRupees ?? 0) });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label={storeMessages.activeFilters} className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={chip.remove}
              aria-label={fill(storeMessages.removeFilter, { name: chip.label })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3 type-small text-surface hover:bg-ink-2"
            >
              {chip.label}
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="quiet" size="small" onClick={control.clearAll}>
        {storeMessages.clearAll}
      </Button>
    </div>
  );
}
