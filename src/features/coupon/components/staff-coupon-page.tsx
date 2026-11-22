'use client';

import Link from 'next/link';
import { lazy, Suspense } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ViewOnlyChip } from '@/components/common/view-only-chip';
import { Button } from '@/components/ui/button';
import { messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponsPath, adminVendorPath, changeAdminCouponPath } from '@/lib/routes';
import { useCouponActions } from '@/features/coupon/hooks/use-coupon-actions';
import { useStaffCoupon } from '@/features/coupon/hooks/use-coupons';
import { chargesVendor, CouponStatus } from '@/features/coupon/types';
import { CouponStatusChip } from './coupon-status-chip';
import { CouponTerms, CouponUsage } from './coupon-terms';
import { whenText } from './coupon-text';

/**
 * One coupon, for staff (Document 5, section 8.3): its status, every term, its usage and when it
 * was made. Admin and marketing change its terms, disable it with a reason, and enable it again;
 * finance and support read it, with "View only". Enabling a coupon a vendor pays for sends it back
 * to that vendor (the backend decides; the page says so before the press).
 */
const StaffDisableCoupon = lazy(() =>
  import('./staff-disable-coupon').then((module) => ({ default: module.StaffDisableCoupon })),
);

export interface StaffCouponAccess {
  canChange: boolean;
  canOpenVendor: boolean;
}

export function StaffCouponPage({
  lang,
  id,
  access,
}: {
  lang: Locale;
  id: string;
  access: StaffCouponAccess;
}) {
  const messages = useMessages();
  const couponMessages = messages.coupon;
  const staffMessages = couponMessages.staff;
  const termMessages = couponMessages.terms;
  const staffCoupon = useStaffCoupon(id);
  const couponActions = useCouponActions(id);
  const coupon = staffCoupon.data;
  const crumbs = [
    { label: staffMessages.title, href: adminCouponsPath(lang) },
    { label: coupon?.code ?? staffMessages.title },
  ];

  if (staffCoupon.isPending) {
    return (
      <div className="grid gap-5">
        <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
        <LoadingBlock messages={messages} lines={8} />
      </div>
    );
  }
  if (staffCoupon.isError || !coupon) {
    return (
      <div className="grid gap-5">
        <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
        <h1 className="type-h2 text-ink">{staffMessages.title}</h1>
        <PartError
          error={staffCoupon.error}
          onRetry={() => void staffCoupon.refetch()}
          messages={messages}
        />
      </div>
    );
  }

  const isDisabled = coupon.status === CouponStatus.Disabled;
  const vendor = coupon.vendorId ? (
    <VendorId lang={lang} vendorId={coupon.vendorId} canOpen={access.canOpenVendor} />
  ) : undefined;
  const { enableError } = couponActions;

  return (
    <div className="grid max-w-[960px] gap-6">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <div className="grid gap-3 stitch-bottom pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h2 break-all text-ink">{coupon.code}</h1>
          <CouponStatusChip status={coupon.status} messages={messages} />
          {access.canChange ? null : <ViewOnlyChip label={staffMessages.viewOnly} />}
        </div>
        <p className="type-small text-ink-2">
          {termMessages.created}: {whenText(coupon.createdAt, lang, '')}
        </p>
      </div>
      {access.canChange ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={changeAdminCouponPath(lang, coupon.id)} className="no-underline">
                {staffMessages.change}
              </Link>
            </Button>
            {isDisabled ? (
              <Button
                type="button"
                variant="secondary"
                loading={couponActions.isEnabling}
                onClick={couponActions.enable}
              >
                {staffMessages.enable}
              </Button>
            ) : (
              <Suspense fallback={null}>
                <StaffDisableCoupon
                  code={coupon.code}
                  isBusy={couponActions.isDisabling}
                  onDisable={couponActions.disable}
                />
              </Suspense>
            )}
          </div>
          {isDisabled && chargesVendor(coupon.fundedBy) ? (
            <p className="type-small text-ink-2">{staffMessages.enableVendorNote}</p>
          ) : null}
          {enableError ? (
            <ErrorMessage
              text={messageFor(enableError, messages)}
              requestId={enableError.requestId}
              messages={messages}
            />
          ) : null}
        </div>
      ) : null}
      <section
        aria-labelledby="coupon-terms-heading"
        className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="coupon-terms-heading" className="type-h3 text-ink">
          {termMessages.title}
        </h2>
        <CouponTerms coupon={coupon} lang={lang} vendor={vendor} />
      </section>
      <section
        aria-labelledby="coupon-usage-heading"
        className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="coupon-usage-heading" className="type-h3 text-ink">
          {termMessages.usageTitle}
        </h2>
        <CouponUsage coupon={coupon} messages={messages} />
      </section>
    </div>
  );
}

/** The coupon's vendor by id (the backend gives no name), a link for those who may open vendors. */
function VendorId({
  lang,
  vendorId,
  canOpen,
}: {
  lang: Locale;
  vendorId: string;
  canOpen: boolean;
}) {
  if (!canOpen) return <span className="break-all">{vendorId}</span>;
  return (
    <Link href={adminVendorPath(lang, vendorId)} className="break-all underline underline-offset-4">
      {vendorId}
    </Link>
  );
}
