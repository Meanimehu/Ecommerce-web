'use client';

import { useState, type FormEvent } from 'react';
import type { Messages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ListFiltersControl } from '@/features/storefront/product-list/hooks/use-list-filters';

/** Whole rupees from what was typed (digits only, commas allowed), or null for no limit. */
function rupeesFrom(text: string): number | null {
  const digits = text.replace(/[,\s]/g, '');
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

/**
 * The price filter (approved Stage 5 screens: "₹ 500 to ₹ 3,000"): the lowest and highest price in
 * whole rupees, applied with "Apply" or Enter. An empty field is no limit; anything that is not a
 * whole number counts as empty. The server swaps a lowest price above the highest.
 */
export function PriceFilter({
  control,
  idPrefix,
  messages,
}: {
  control: ListFiltersControl;
  idPrefix: string;
  messages: Messages;
}) {
  const storeMessages = messages.store;
  const { minRupees, maxRupees } = control.filters;
  const [lowest, setLowest] = useState(minRupees === null ? '' : String(minRupees));
  const [highest, setHighest] = useState(maxRupees === null ? '' : String(maxRupees));
  // The fields follow a change made elsewhere (a removed chip, "Clear all"), as React advises:
  // compared while drawing, not in an effect.
  const [shownLimits, setShownLimits] = useState({ minRupees, maxRupees });
  if (shownLimits.minRupees !== minRupees || shownLimits.maxRupees !== maxRupees) {
    setShownLimits({ minRupees, maxRupees });
    setLowest(minRupees === null ? '' : String(minRupees));
    setHighest(maxRupees === null ? '' : String(maxRupees));
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    control.setPrice(rupeesFrom(lowest), rupeesFrom(highest));
  }

  return (
    <form onSubmit={apply} className="grid gap-3 py-4" aria-labelledby={`${idPrefix}-price`}>
      <p id={`${idPrefix}-price`} className="font-medium text-ink">
        {storeMessages.price}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 type-small text-ink-2">
          {storeMessages.lowestPrice}
          <Input
            inputMode="numeric"
            autoComplete="off"
            value={lowest}
            onChange={(event) => setLowest(event.target.value)}
          />
        </label>
        <label className="grid gap-1 type-small text-ink-2">
          {storeMessages.highestPrice}
          <Input
            inputMode="numeric"
            autoComplete="off"
            value={highest}
            onChange={(event) => setHighest(event.target.value)}
          />
        </label>
      </div>
      <Button type="submit" variant="secondary" size="small" className="justify-self-start">
        {storeMessages.applyPrice}
      </Button>
    </form>
  );
}
