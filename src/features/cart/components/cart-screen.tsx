'use client';

import { ShoppingBag } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StateBlock } from '@/components/common/state-block';
import { fill } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { homePath } from '@/lib/routes';
import { formatRupees } from '@/utils/format';
import { useCart } from '@/features/cart/hooks/use-cart';
import { useCoupon } from '@/features/cart/hooks/use-coupon';
import { isUnbuyable } from '@/features/cart/rules';
import type { Cart } from '@/features/cart/types';
import { CartLineItem } from './cart-line';
import { CartTotals } from './cart-totals';
import { CouponForm } from './coupon-form';
import { UnavailableBanner } from './unavailable-banner';

/**
 * The cart, review only (Document 5, section 6.3, D5-02; approved Stage 5): lines grouped by vendor
 * with quantity, remove, line total and a subtotal per vendor; a totals block with what the backend
 * sends; line problems from the backend's line status in text; "Remove unavailable items"; a coupon
 * field kept only in this page's memory and sent with every cart call; shipping not calculated yet;
 * no checkout button. The screen shows the backend's answer, never its own sum, and never stock
 * numbers (the backend never sends them). It only draws; the calls and choices are in its hooks.
 */
export function CartScreen({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const coupon = useCoupon();
  const cart = useCart(coupon.appliedCode);

  function cartBody() {
    if (cart.isPending) return <LoadingBlock messages={messages} lines={5} />;
    if (cart.isError) {
      return (
        <PartError error={cart.error} onRetry={() => void cart.refetch()} messages={messages} />
      );
    }
    if (cart.data.sellers.length === 0) return <EmptyCart lang={lang} messages={messages} />;
    return <CartContents lang={lang} cart={cart.data} coupon={coupon} messages={messages} />;
  }

  return (
    <div className="grid gap-6">
      <h1 className="type-h1 text-ink">{messages.cart.title}</h1>
      {cartBody()}
    </div>
  );
}

function EmptyCart({ lang, messages }: { lang: Locale; messages: Messages }) {
  const cartMessages = messages.cart;
  return (
    <StateBlock icon={ShoppingBag} title={cartMessages.empty} text={cartMessages.emptyText}>
      <Button asChild>
        <a href={homePath(lang)} className="no-underline">
          {cartMessages.continueShopping}
        </a>
      </Button>
    </StateBlock>
  );
}

function CartContents({
  lang,
  cart,
  coupon,
  messages,
}: {
  lang: Locale;
  cart: Cart;
  coupon: ReturnType<typeof useCoupon>;
  messages: Messages;
}) {
  const hasUnbuyableLines = cart.sellers.some((seller) => seller.lines.some(isUnbuyable));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="grid gap-5">
        {hasUnbuyableLines ? (
          <UnavailableBanner couponCode={coupon.appliedCode} messages={messages} />
        ) : null}
        {cart.sellers.map((seller) => (
          <SellerLines
            key={seller.vendorId ?? 'none'}
            lang={lang}
            seller={seller}
            couponCode={coupon.appliedCode}
            messages={messages}
          />
        ))}
      </div>
      <aside className="grid gap-4">
        <CartTotals cart={cart} messages={messages} />
        <CouponForm coupon={coupon} cartCoupon={cart.coupon} messages={messages} />
        <Banner tone="info">{messages.cart.checkoutSoon}</Banner>
      </aside>
    </div>
  );
}

/** One seller's lines, with that seller's subtotal. */
function SellerLines({
  lang,
  seller,
  couponCode,
  messages,
}: {
  lang: Locale;
  seller: Cart['sellers'][number];
  couponCode: string;
  messages: Messages;
}) {
  const cartMessages = messages.cart;
  const headingId = `seller-${seller.vendorId}`;
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-3 rounded-1 border border-line bg-surface p-4 sm:p-5"
    >
      <h2 id={headingId} className="type-label text-ink-2">
        {fill(cartMessages.soldBy, { name: seller.vendorName ?? '—' })}
      </h2>
      <ul className="grid divide-y divide-line">
        {seller.lines.map((line) => (
          <CartLineItem
            key={line.variantId}
            lang={lang}
            line={line}
            couponCode={couponCode}
            messages={messages}
          />
        ))}
      </ul>
      <p className="flex justify-between border-t border-line pt-3 type-small">
        <span className="text-ink-2">{cartMessages.vendorSubtotal}</span>
        <span className="font-medium tabular-nums text-ink">
          {formatRupees(seller.subtotalPaise)}
        </span>
      </p>
    </section>
  );
}
