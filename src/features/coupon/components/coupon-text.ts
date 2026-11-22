import { fill } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { formatDate, formatRupees, formatTime } from '@/utils/format';
import type { CategoryNode } from '@/features/storefront/product-list/types';
import { bpsToPercentText, DiscountType, type Coupon } from '@/features/coupon/types';

/** A coupon's terms in words, shared by the staff's and the vendor's coupon screens. */

/** "10% off, at most ₹500" or "₹200 off". */
export function discountText(coupon: Coupon, messages: Messages): string {
  const couponMessages = messages.coupon;
  const discount =
    coupon.discountType === DiscountType.Percent
      ? fill(couponMessages.discount.percent, { value: bpsToPercentText(coupon.value) })
      : fill(couponMessages.discount.fixed, { amount: formatRupees(coupon.value) });
  if (coupon.maxDiscountPaise === null) return discount;
  return fill(couponMessages.discount.capped, {
    discount,
    cap: formatRupees(coupon.maxDiscountPaise),
  });
}

/** "12 of 100", or "12, no limit". */
export function usedText(coupon: Coupon, messages: Messages): string {
  const used = coupon.usage?.held ?? 0;
  const staffMessages = messages.coupon.staff;
  return coupon.usageLimit === null
    ? fill(staffMessages.usedNoLimit, { used })
    : fill(staffMessages.usedOf, { used, limit: coupon.usageLimit });
}

/** A time as "22 Nov 2026, 10:00 am", or the words for no time. */
export function whenText(iso: string | null, lang: Locale, none: string): string {
  return iso ? `${formatDate(iso, lang)}, ${formatTime(iso, lang)}` : none;
}

/** Every category of the public tree with its path ("Women › Kurtas"), in display order. */
export function categoryPaths(
  nodes: readonly CategoryNode[],
  parents: string[] = [],
): { id: string; path: string }[] {
  return nodes.flatMap((node) => {
    const names = [...parents, node.name];
    return [{ id: node.id, path: names.join(' › ') }, ...categoryPaths(node.children, names)];
  });
}
