'use client';

import { useState, type FormEvent } from 'react';
import { fill } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import type { CartCoupon } from '@/features/cart/types';

/**
 * The coupon field on the cart page (Document 5, section 6.3): what the person types, and the code
 * the cart previews once they apply it. The code lives only in this page's memory and is sent with
 * every cart call; it is never stored. The screen, `coupon-form.tsx`, only draws.
 */
export function useCoupon() {
  const [typedCode, setTypedCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');

  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedCode(typedCode.trim());
  }

  function removeCoupon() {
    setAppliedCode('');
    setTypedCode('');
  }

  return { typedCode, setTypedCode, appliedCode, applyCoupon, removeCoupon };
}

/** How the coupon note reads: applied, or why not. */
export enum CouponNoteTone {
  Applied = 'applied',
  NotApplied = 'not-applied',
}

/** What the backend said about the coupon, in the person's words; nothing before a code is tried. */
export function couponNoteOf(
  coupon: CartCoupon | null,
  messages: Messages,
): { tone: CouponNoteTone; text: string } | null {
  if (!coupon) return null;
  const cartMessages = messages.cart;
  if (coupon.applied) {
    return {
      tone: CouponNoteTone.Applied,
      text: fill(cartMessages.couponApplied, { code: coupon.code }),
    };
  }
  const reasons = cartMessages.couponReasons as Record<string, string>;
  return {
    tone: CouponNoteTone.NotApplied,
    text: reasons[coupon.reason ?? ''] ?? cartMessages.couponReasons.COUPON_NOT_APPLICABLE,
  };
}
