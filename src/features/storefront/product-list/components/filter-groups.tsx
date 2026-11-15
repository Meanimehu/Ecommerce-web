'use client';

import type { Messages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ListFiltersControl } from '@/features/storefront/product-list/hooks/use-list-filters';
import {
  activeFilterCount,
  chosenValues,
  FilterGroup,
  isChosen,
} from '@/features/storefront/product-list/rules';
import type { Facets } from '@/features/storefront/product-list/types';
import { PriceFilter } from './price-filter';

/** One choice in a filter group, with the backend's count for it. */
type Choice = { value: string; label: string; count: number; hex?: string | null };

/**
 * The filter groups of a list (Document 6, 8.8; the approved Stage 5 storefront screens), in their
 * order: size, colour, price, brand, then "Clear all filters". Each choice shows the count the
 * backend sends; a choice with no products is not shown unless it is chosen. Used in the side panel
 * on wide screens and in the sheet on narrow ones; `idPrefix` keeps the two sets of ids apart.
 */
export function FilterGroups({
  control,
  facets,
  hiddenGroups = [],
  idPrefix,
  messages,
}: {
  control: ListFiltersControl;
  facets: Facets;
  hiddenGroups?: readonly FilterGroup[];
  idPrefix: string;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const groupProps = { control, idPrefix, hiddenGroups };
  return (
    <div className="grid divide-y divide-line">
      <ChoiceGroup
        {...groupProps}
        group={FilterGroup.Size}
        legend={storeMessages.size}
        choices={facets.sizes.map((size) => ({ value: size.code, ...size }))}
      />
      <ChoiceGroup
        {...groupProps}
        group={FilterGroup.Colour}
        legend={storeMessages.colour}
        choices={facets.colours.map((colour) => ({ value: colour.code, ...colour }))}
      />
      <PriceFilter control={control} idPrefix={idPrefix} messages={messages} />
      <ChoiceGroup
        {...groupProps}
        group={FilterGroup.Brand}
        legend={storeMessages.brand}
        choices={facets.brands.map((brand) => ({
          value: brand.id,
          label: brand.name,
          count: brand.count,
        }))}
      />
      {activeFilterCount(control.filters) ? (
        <div className="py-4">
          <Button type="button" variant="quiet" onClick={control.clearAll}>
            {storeMessages.clearAllFilters}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ChoiceGroup({
  control,
  group,
  legend,
  choices,
  idPrefix,
  hiddenGroups,
}: {
  control: ListFiltersControl;
  group: FilterGroup;
  legend: string;
  choices: Choice[];
  idPrefix: string;
  hiddenGroups: readonly FilterGroup[];
}) {
  const { filters } = control;
  // A chosen value the backend no longer counts (from a shared address) stays, so it can be
  // unticked; it is shown by its code.
  const counted = new Set(choices.map((choice) => choice.value));
  const missing = chosenValues(filters, group)
    .filter((value) => !counted.has(value))
    .map((value): Choice => ({ value, label: value, count: 0 }));
  const shown = [...choices, ...missing].filter(
    (choice) => choice.count > 0 || isChosen(filters, group, choice.value),
  );
  if (hiddenGroups.includes(group) || !shown.length) return null;
  return (
    <fieldset className="grid gap-1 pt-3 pb-4">
      <legend className="font-medium text-ink">{legend}</legend>
      {shown.map((choice) => {
        const id = `${idPrefix}-${group}-${choice.value}`;
        return (
          <label
            key={choice.value}
            htmlFor={id}
            className="flex min-h-11 cursor-pointer items-center gap-3 text-ink"
          >
            <Checkbox
              id={id}
              checked={isChosen(filters, group, choice.value)}
              onChange={() => control.toggle(group, choice.value)}
              className="mt-0"
            />
            {choice.hex ? (
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-control"
                style={{ backgroundColor: choice.hex }}
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{choice.label}</span>
            <span className="type-small text-muted-foreground tabular-nums">{choice.count}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
