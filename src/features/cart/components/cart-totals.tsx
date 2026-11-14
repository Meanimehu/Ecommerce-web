import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { formatRupees } from '@/utils/format';
import type { Cart } from '@/features/cart/types';

/** The cart's summary: only the totals the backend sends, never a sum made here. */
export function CartTotals({ cart, messages }: { cart: Cart; messages: Messages }) {
  const cartMessages = messages.cart;
  const totals = cart.totals;
  return (
    <section
      aria-labelledby="totals-heading"
      className="grid gap-3 rounded-1 border border-line bg-surface p-4"
    >
      <h2 id="totals-heading" className="type-h4 text-ink">
        {cartMessages.summary}
      </h2>
      <dl className="grid gap-2 type-small">
        <TotalRow
          label={fill(cartMessages.items, { count: totals.itemCount })}
          value={formatRupees(totals.subtotalPaise)}
        />
        {totals.savingsPaise > 0 ? (
          <TotalRow label={cartMessages.savings} value={`−${formatRupees(totals.savingsPaise)}`} />
        ) : null}
        {totals.couponDiscountPaise > 0 ? (
          <TotalRow
            label={cartMessages.couponDiscount}
            value={`−${formatRupees(totals.couponDiscountPaise)}`}
          />
        ) : null}
        <TotalRow label={cartMessages.shipping} value={cartMessages.shippingLater} />
        <TotalRow
          label={cartMessages.estimatedTotal}
          value={formatRupees(totals.estimatedTotalPaise)}
          isTotal
        />
      </dl>
      <p className="type-caption text-muted-foreground">{cartMessages.taxesIncluded}</p>
    </section>
  );
}

/** One row of the summary; the last, the estimated total, is set apart. */
function TotalRow({
  label,
  value,
  isTotal = false,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) {
  return (
    <div
      className={
        isTotal
          ? 'flex justify-between gap-3 border-t border-line pt-2'
          : 'flex justify-between gap-3'
      }
    >
      <dt className={isTotal ? 'font-medium text-ink' : 'text-ink-2'}>{label}</dt>
      <dd className={isTotal ? 'font-medium tabular-nums text-ink' : 'tabular-nums text-ink'}>
        {value}
      </dd>
    </div>
  );
}
