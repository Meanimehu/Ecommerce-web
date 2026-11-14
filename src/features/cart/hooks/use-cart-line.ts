'use client';

import { messageFor, type AppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { useChangeQuantity, useRemoveLine } from './use-cart';
import { hasProblem, isUnbuyable, LineStatus, MAX_QUANTITY_PER_LINE } from '@/features/cart/rules';
import type { CartLine } from '@/features/cart/types';

/** The quantities a line can be set to. */
const QUANTITY_CHOICES = [...Array(MAX_QUANTITY_PER_LINE).keys()].map((index) => index + 1);

/**
 * One cart line (Document 5, section 6.3): changing its quantity, removing it, and what the
 * backend says about it, in words. A change whose outcome is unknown says so, so the person checks
 * the cart before trying again. The screen, `cart-line.tsx`, only draws.
 */
export function useCartLine({ line, couponCode }: { line: CartLine; couponCode: string }) {
  const messages = useMessages();
  const changeQuantity = useChangeQuantity(couponCode);
  const removeLine = useRemoveLine(couponCode);
  const error = changeQuantity.error ?? removeLine.error;
  const hasLineProblem = hasProblem(line);

  function chooseQuantity(quantity: string) {
    changeQuantity.mutate({ variantId: line.variantId, quantity: Number(quantity) });
  }

  function removeThisLine() {
    removeLine.mutate(line.variantId);
  }

  return {
    quantityChoices: QUANTITY_CHOICES,
    canChangeQuantity: !isUnbuyable(line),
    chooseQuantity,
    isChanging: changeQuantity.isPending,
    removeThisLine,
    isRemoving: removeLine.isPending,
    hasProblem: hasLineProblem,
    isNoted: hasLineProblem || line.status === LineStatus.LowStock,
    statusLabel: (messages.cart.status as Record<string, string>)[line.status] ?? line.status,
    explanation: explanationOf(line, messages),
    errorText: error ? changeErrorText(error, messages) : null,
    errorRequestId: error?.requestId,
  };
}

/** A plain explanation of a line's status and reason (area-5-sales-cart-coupons.md, cart view). */
function explanationOf(line: CartLine, messages: Messages): string {
  const explain = messages.cart.explain;
  if (line.status === LineStatus.LowStock) return explain.lowStock;
  if (line.status === LineStatus.InsufficientStock) return explain.insufficient;
  if (line.status === LineStatus.OutOfStock) return explain.outOfStock;
  return (explain.reasons as Record<string, string>)[line.reason ?? ''] ?? explain.unavailable;
}

function changeErrorText(error: AppError, messages: Messages): string {
  return error.outcomeUnknown ? messages.cart.changeUnknown : messageFor(error, messages);
}
