import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { cn } from '@/utils/cn';
import { formatRupees } from '@/utils/format';

/**
 * A price (Document 6, 8.6; Document 5, section 3): the price in ink, the MRP struck through in muted only when the
 * backend's price is below it, then "32% off". Prices come from the backend in whole paise, GST included.
 */
export function Price({ pricePaise, mrpPaise, discountPercent, t, size = 'card' }: { pricePaise: number; mrpPaise: number; discountPercent: number; t: Messages; size?: 'card' | 'page' }) {
  const reduced = mrpPaise > pricePaise;
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 tabular-nums', size === 'page' ? 'type-h3' : 'type-small')}>
      <span className="font-medium text-ink">{formatRupees(pricePaise)}</span>
      {reduced ? (
        <>
          <span className="text-muted-foreground line-through">
            <span className="sr-only">{t.store.mrp} </span>
            {formatRupees(mrpPaise)}
          </span>
          {discountPercent > 0 ? <span className={cn('font-medium text-ink', size === 'page' && 'type-small')}>{fill(t.store.off, { percent: discountPercent })}</span> : null}
        </>
      ) : null}
    </p>
  );
}
