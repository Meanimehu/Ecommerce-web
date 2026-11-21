'use client';

import type { ReactNode } from 'react';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatRupees } from '@/utils/format';
import { useCategoryTree } from '@/features/storefront/product-list/hooks/use-product-list';
import {
  bpsToPercentText,
  chargesVendor,
  FundedBy,
  type Coupon,
  type CouponTermsShape,
} from '@/features/coupon/types';
import { categoryPaths, discountText, whenText } from './coupon-text';

/**
 * Every term of a coupon, as a list of label and value (Document 5, sections 8.2 and 8.3): what it
 * takes off, its limits and dates, who pays, what it is limited to, and for a coupon a vendor pays
 * for, the most that vendor can pay and whether the vendor has accepted. The staff's and the
 * vendor's coupon screens, and the coupon request screens (with the terms a request proposes), all
 * show it. Categories are named from the public tree; a category it does not list (switched off) is
 * shown by id, and products by id unless the screen knows their names: the backend gives only ids.
 */
export function CouponTerms({
  coupon,
  lang,
  vendor,
  productNames,
}: {
  coupon: CouponTermsShape;
  lang: Locale;
  /** The vendor's id, or a link to it, when the screen shows who the vendor is. */
  vendor?: ReactNode;
  /** Product names by id, when the screen has them (a vendor's own products). */
  productNames?: ReadonlyMap<string, string>;
}) {
  const messages = useMessages();
  const termMessages = messages.coupon.terms;
  const categoryTree = useCategoryTree();
  const paths = new Map(
    categoryPaths(categoryTree.data?.items ?? []).map(({ id, path }) => [id, path]),
  );
  const isVendorPaid = coupon.fundedBy !== undefined && chargesVendor(coupon.fundedBy);

  const rows: { label: string; value: ReactNode }[] = [
    { label: termMessages.discount, value: discountText(coupon, messages) },
    {
      label: termMessages.minCart,
      value: coupon.minCartPaise === 0 ? termMessages.none : formatRupees(coupon.minCartPaise),
    },
    { label: termMessages.starts, value: whenText(coupon.startsAt, lang, termMessages.atOnce) },
    { label: termMessages.ends, value: whenText(coupon.endsAt, lang, termMessages.noEnd) },
    { label: termMessages.usageLimit, value: coupon.usageLimit ?? termMessages.noLimit },
    { label: termMessages.perUserLimit, value: coupon.perUserLimit ?? termMessages.noLimit },
    {
      label: termMessages.excludeSaleItems,
      value: coupon.excludeSaleItems ? termMessages.excluded : termMessages.included,
    },
  ];
  if (coupon.fundedBy) {
    rows.push({ label: termMessages.fundedBy, value: messages.coupon.fundedBy[coupon.fundedBy] });
  }
  if (vendor && coupon.vendorId) rows.push({ label: termMessages.vendor, value: vendor });
  if (coupon.fundedBy === FundedBy.Split) {
    rows.push({
      label: termMessages.marketplaceShare,
      value: `${bpsToPercentText(coupon.marketplaceShareBps ?? 0)}%`,
    });
  }
  rows.push(
    {
      label: termMessages.categories,
      value: (
        <IdList
          ids={coupon.categoryIds}
          nameOf={(id) => paths.get(id)}
          none={termMessages.everyCategory}
        />
      ),
    },
    {
      label: termMessages.products,
      value: (
        <IdList
          ids={coupon.productIds}
          nameOf={(id) => productNames?.get(id)}
          none={termMessages.everyProduct}
        />
      ),
    },
  );
  if (coupon.maxExposurePaise !== undefined && (isVendorPaid || !coupon.fundedBy)) {
    rows.push({
      label: termMessages.maxExposure,
      value:
        coupon.maxExposurePaise === null
          ? termMessages.noLimit
          : formatRupees(coupon.maxExposurePaise),
    });
  }
  if (isVendorPaid && coupon.vendorAcceptedAt !== undefined) {
    rows.push({
      label: termMessages.acceptedAt,
      value: whenText(coupon.vendorAcceptedAt, lang, termMessages.notAccepted),
    });
  }

  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="type-small text-ink-2">{row.label}</dt>
          <dd className="text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A coupon's usage so far, from the backend's count. */
export function CouponUsage({ coupon, messages }: { coupon: Coupon; messages: Messages }) {
  const termMessages = messages.coupon.terms;
  const usage = coupon.usage;
  if (!usage) return null;
  const rows = [
    { label: termMessages.used, value: usage.held },
    { label: termMessages.remaining, value: usage.remaining ?? termMessages.noLimit },
    { label: termMessages.reclaims, value: usage.overLimitReclaims },
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="type-small text-ink-2">{row.label}</dt>
          <dd className="text-ink tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function IdList({
  ids,
  nameOf,
  none,
}: {
  ids: readonly string[];
  nameOf?: (id: string) => string | undefined;
  none: string;
}) {
  if (ids.length === 0) return none;
  return (
    <ul className="grid gap-1">
      {ids.map((id) => (
        <li key={id} className="break-all">
          {nameOf?.(id) ?? <span className="type-small">{id}</span>}
        </li>
      ))}
    </ul>
  );
}
