'use client';

import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StateBlock } from '@/components/common/state-block';
import { StatusChip } from '@/components/common/status-chip';
import { PhotoFrame } from '@/components/common/photo-frame';
import { useCart, useChangeQuantity, useRemoveLine, useRemoveUnavailable } from '@/hooks/use-cart';
import { fill, messageFor, toAppError } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { isUnbuyable, type Cart, type CartLine } from '@/types/cart';
import { productPath } from '@/types/catalogue';
import { formatRupees } from '@/utils/format';

/**
 * The cart, review only (Document 5, section 6.3, D5-02; approved Stage 5): lines grouped by vendor with quantity,
 * remove, line total and a subtotal per vendor; a totals block with what the backend sends; line problems from the
 * backend's line status in text; "Remove unavailable items"; a coupon field kept only in this page's memory and sent
 * with every cart call; shipping not calculated yet; no checkout button. The screen shows the backend's answer, never
 * its own sum. Stock numbers are never shown (the backend never sends them).
 */
const QUANTITIES = Array.from({ length: 10 }, (_, i) => i + 1);

export function CartScreen({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.cart;
  const [couponCode, setCouponCode] = useState('');
  const [typed, setTyped] = useState('');
  const cart = useCart(couponCode);
  const clear = useRemoveUnavailable(couponCode);

  return (
    <div className="grid gap-6">
      <h1 className="type-h1 text-ink">{c.title}</h1>
      {cart.isPending ? (
        <LoadingBlock messages={t} lines={5} />
      ) : cart.isError ? (
        <PartError error={cart.error} onRetry={() => void cart.refetch()} messages={t} />
      ) : cart.data.sellers.length === 0 ? (
        <StateBlock icon={ShoppingBag} title={c.empty} text={c.emptyText}>
          <Button asChild>
            <a href={`/${lang}`} className="no-underline">
              {c.continueShopping}
            </a>
          </Button>
        </StateBlock>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="grid gap-5">
            {cart.data.sellers.some((seller) => seller.lines.some(isUnbuyable)) ? (
              <Banner
                tone="warning"
                action={
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="secondary" size="small" disabled={clear.isPending}>
                        {c.removeUnavailable}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{c.removeUnavailableTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{c.removeUnavailableBody}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction variant="destructiveConfirm" onClick={() => clear.mutate()}>
                          {c.remove}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                }
              >
                {c.someUnavailable}
              </Banner>
            ) : null}
            {clear.error ? <ErrorMessage text={messageFor(toAppError(clear.error), t)} requestId={toAppError(clear.error).requestId} messages={t} /> : null}
            {cart.data.sellers.map((seller) => (
              <section key={seller.vendorId ?? 'none'} aria-labelledby={`seller-${seller.vendorId}`} className="grid gap-3 rounded-1 border border-line bg-surface p-4 sm:p-5">
                <h2 id={`seller-${seller.vendorId}`} className="type-label text-ink-2">
                  {fill(c.soldBy, { name: seller.vendorName ?? '—' })}
                </h2>
                <ul className="grid divide-y divide-line">
                  {seller.lines.map((line) => (
                    <Line key={line.variantId} lang={lang} line={line} couponCode={couponCode} />
                  ))}
                </ul>
                <p className="flex justify-between border-t border-line pt-3 type-small">
                  <span className="text-ink-2">{c.vendorSubtotal}</span>
                  <span className="font-medium tabular-nums text-ink">{formatRupees(seller.subtotalPaise)}</span>
                </p>
              </section>
            ))}
          </div>
          <aside className="grid gap-4">
            <Totals cart={cart.data} t={t} />
            <form
              className="grid gap-2 rounded-1 border border-line bg-surface p-4"
              onSubmit={(event) => {
                event.preventDefault();
                setCouponCode(typed.trim());
              }}
            >
              <label htmlFor="coupon-code" className="type-label text-ink">
                {c.coupon}
              </label>
              <div className="flex gap-2">
                <Input id="coupon-code" value={typed} maxLength={40} autoCapitalize="characters" spellCheck={false} onChange={(event) => setTyped(event.target.value)} className="min-w-0 flex-1 uppercase" />
                <Button type="submit" variant="secondary">
                  {c.apply}
                </Button>
              </div>
              <div role="status">
                {cart.data.coupon ? (
                  cart.data.coupon.applied ? (
                    <p className="type-small text-success">{fill(c.couponApplied, { code: cart.data.coupon.code })}</p>
                  ) : (
                    <p className="type-small text-ink">{(c.couponReasons as Record<string, string>)[cart.data.coupon.reason ?? ''] ?? c.couponReasons.COUPON_NOT_APPLICABLE}</p>
                  )
                ) : null}
              </div>
              {couponCode ? (
                <Button
                  type="button"
                  variant="quiet"
                  size="small"
                  className="justify-self-start"
                  onClick={() => {
                    setCouponCode('');
                    setTyped('');
                  }}
                >
                  {c.removeCoupon}
                </Button>
              ) : null}
            </form>
            <Banner tone="info">{c.checkoutSoon}</Banner>
          </aside>
        </div>
      )}
    </div>
  );
}

function Totals({ cart, t }: { cart: Cart; t: Messages }) {
  const c = t.cart;
  const row = (label: string, value: string, strong = false) => (
    <div className={strong ? 'flex justify-between gap-3 border-t border-line pt-2' : 'flex justify-between gap-3'}>
      <dt className={strong ? 'font-medium text-ink' : 'text-ink-2'}>{label}</dt>
      <dd className={strong ? 'font-medium tabular-nums text-ink' : 'tabular-nums text-ink'}>{value}</dd>
    </div>
  );
  return (
    <section aria-labelledby="totals-heading" className="grid gap-3 rounded-1 border border-line bg-surface p-4">
      <h2 id="totals-heading" className="type-h4 text-ink">
        {c.summary}
      </h2>
      <dl className="grid gap-2 type-small">
        {row(fill(c.items, { count: cart.totals.itemCount }), formatRupees(cart.totals.subtotalPaise))}
        {cart.totals.savingsPaise > 0 ? row(c.savings, `−${formatRupees(cart.totals.savingsPaise)}`) : null}
        {cart.totals.couponDiscountPaise > 0 ? row(c.couponDiscount, `−${formatRupees(cart.totals.couponDiscountPaise)}`) : null}
        {row(c.shipping, c.shippingLater)}
        {row(c.estimatedTotal, formatRupees(cart.totals.estimatedTotalPaise), true)}
      </dl>
      <p className="type-caption text-muted-foreground">{c.taxesIncluded}</p>
    </section>
  );
}

function Line({ lang, line, couponCode }: { lang: Locale; line: CartLine; couponCode: string }) {
  const t = useMessages();
  const c = t.cart;
  const change = useChangeQuantity(couponCode);
  const removeLine = useRemoveLine(couponCode);
  const error = change.error ?? removeLine.error;
  const problem = line.status === 'unavailable' || line.status === 'out_of_stock' || line.status === 'insufficient_stock';
  const quantityId = `quantity-${line.variantId}`;
  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-4 first:pt-0">
      <PhotoFrame src={line.image} alt="" unavailable={t.common.photoUnavailable} dimmed={problem} />
      <div className="grid gap-2">
        <div className="flex flex-wrap justify-between gap-2">
          <a href={productPath(lang, line.productId, line.title)} className="font-medium text-ink underline-offset-4 hover:underline">
            {line.title}
          </a>
          <span className="font-medium tabular-nums text-ink">{formatRupees(line.lineTotalPaise)}</span>
        </div>
        <p className="type-small text-ink-2">
          {[line.sizeCode ? fill(c.size, { size: line.sizeCode }) : null, line.colourCode ? fill(c.colour, { colour: line.colourCode }) : null].filter(Boolean).join(', ')}
        </p>
        <p className="type-small tabular-nums text-ink">
          {formatRupees(line.unitPricePaise)} {c.each}
          {line.strikeThroughPaise ? <span className="ms-2 text-muted-foreground line-through">{formatRupees(line.strikeThroughPaise)}</span> : null}
        </p>
        {problem || line.status === 'low_stock' ? (
          <div className="grid gap-1">
            <div>
              <StatusChip tone={line.status === 'low_stock' ? 'warning' : 'error'} label={(c.status as Record<string, string>)[line.status] ?? line.status} />
            </div>
            <p className="type-small text-ink">{explain(line, t)}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          {line.status !== 'unavailable' && line.status !== 'out_of_stock' ? (
            <div className="grid gap-1">
              <label htmlFor={quantityId} className="type-small text-ink-2">
                {c.quantity}
              </label>
              <Select id={quantityId} value={String(line.quantity)} disabled={change.isPending} className="w-24 lg:h-10" onChange={(event) => change.mutate({ variantId: line.variantId, quantity: Number(event.target.value) })}>
                {QUANTITIES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <Button type="button" variant="quiet" size="small" disabled={removeLine.isPending} onClick={() => removeLine.mutate(line.variantId)}>
            {c.remove}
            <span className="sr-only">: {line.title}</span>
          </Button>
        </div>
        {error ? <ErrorMessage text={toAppError(error).outcomeUnknown ? c.changeUnknown : messageFor(toAppError(error), t)} requestId={toAppError(error).requestId} messages={t} /> : null}
      </div>
    </li>
  );
}

/** A plain explanation of a line's status and reason (area-5-sales-cart-coupons.md, cart view). */
function explain(line: CartLine, t: Messages): string {
  const c = t.cart;
  if (line.status === 'low_stock') return c.explain.lowStock;
  if (line.status === 'insufficient_stock') return c.explain.insufficient;
  if (line.status === 'out_of_stock') return c.explain.outOfStock;
  return (c.explain.reasons as Record<string, string>)[line.reason ?? ''] ?? c.explain.unavailable;
}
