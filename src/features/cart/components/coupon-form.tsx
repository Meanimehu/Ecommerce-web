'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Messages } from '@/lib/i18n';
import { couponNoteOf, CouponNoteTone, type useCoupon } from '@/features/cart/hooks/use-coupon';
import type { CartCoupon } from '@/features/cart/types';

/** The longest coupon code the field takes. */
const COUPON_CODE_MAX_LENGTH = 40;

/**
 * The coupon field (Document 5, section 6.3): apply a code, see what the backend says about it,
 * remove it. A code that does not apply is a note, never an error. It only draws; the code is
 * kept in `use-coupon.ts`.
 */
export function CouponForm({
  coupon,
  cartCoupon,
  messages,
}: {
  coupon: ReturnType<typeof useCoupon>;
  cartCoupon: CartCoupon | null;
  messages: Messages;
}) {
  const cartMessages = messages.cart;
  const note = couponNoteOf(cartCoupon, messages);
  return (
    <form
      className="grid gap-2 rounded-1 border border-line bg-surface p-4"
      onSubmit={coupon.applyCoupon}
    >
      <label htmlFor="coupon-code" className="type-label text-ink">
        {cartMessages.coupon}
      </label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={coupon.typedCode}
          maxLength={COUPON_CODE_MAX_LENGTH}
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => coupon.setTypedCode(event.target.value)}
          className="min-w-0 flex-1 uppercase"
        />
        <Button type="submit" variant="secondary">
          {cartMessages.apply}
        </Button>
      </div>
      <div role="status">
        {note ? (
          <p
            className={
              note.tone === CouponNoteTone.Applied
                ? 'type-small text-success'
                : 'type-small text-ink'
            }
          >
            {note.text}
          </p>
        ) : null}
      </div>
      {coupon.appliedCode ? (
        <Button
          type="button"
          variant="quiet"
          size="small"
          className="justify-self-start"
          onClick={coupon.removeCoupon}
        >
          {cartMessages.removeCoupon}
        </Button>
      ) : null}
    </form>
  );
}
