'use client';

import { Ticket } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
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
import { Select } from '@/components/ui/select';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myCouponsPath } from '@/lib/routes';
import { formatRupees } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useMyCouponActions } from '@/features/coupon/hooks/use-my-coupon-actions';
import { useMyCoupons } from '@/features/coupon/hooks/use-coupons';
import {
  COUPON_STATUSES,
  CouponStatus,
  isCouponStatus,
  type Coupon,
} from '@/features/coupon/types';
import { CouponStatusChip } from './coupon-status-chip';
import { CouponTab, CouponTabs } from './coupon-tabs';
import { CouponTerms } from './coupon-terms';

/**
 * The coupons that charge the vendor (Document 5, section 8.2): each with every term, the most the
 * vendor can pay, and whether it is accepted; a status filter in the address. Accepting needs an
 * approved vendor and sends the fingerprint of the exact terms shown; disabling (which declines a
 * pending coupon) works in any vendor status. Each asks first. The backend has no single-coupon
 * read for a vendor, so each coupon is shown whole in the list. What happens on a press is in
 * `features/coupon/hooks/use-my-coupon-actions.ts`.
 */
const PAGE_SIZE = 10;

export function MyCouponList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const vendorMessages = messages.coupon.vendor;
  const router = useRouter();
  const searchParams = useSearchParams();
  const askedStatus = searchParams.get('status');
  const status = isCouponStatus(askedStatus) ? askedStatus : '';
  const page = pageNumber(searchParams.get('page'));
  const myCoupons = useMyCoupons({ status: status || undefined, page, limit: PAGE_SIZE });
  const myVendor = useMyVendor();
  const isApproved = myVendor.data?.status === VendorStatus.Approved;
  const listPath = myCouponsPath(lang);

  /** With scripts, only a chosen status goes into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = String(new FormData(event.currentTarget).get('status') ?? '');
    router.push(withQuery(listPath, { status: chosen }));
  }

  return (
    <div className="grid gap-5">
      <h1 className="type-h2 text-ink">{vendorMessages.title}</h1>
      <CouponTabs lang={lang} current={CouponTab.Coupons} messages={messages} />
      <p className="max-w-[72ch] text-ink-2">{vendorMessages.intro}</p>
      <form
        method="get"
        action={listPath}
        onSubmit={showResults}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grid gap-1.5">
          <span className="type-label text-ink">{vendorMessages.filters.status}</span>
          <Select name="status" defaultValue={status} className="lg:h-10">
            <option value="">{vendorMessages.filters.all}</option>
            {COUPON_STATUSES.map((value) => (
              <option key={value} value={value}>
                {messages.coupon.status[value]}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          {vendorMessages.filters.show}
        </Button>
      </form>
      <MyCouponResults
        lang={lang}
        myCoupons={myCoupons}
        isApproved={isApproved}
        isFiltered={Boolean(status)}
        page={page}
        hrefFor={(pageToShow) =>
          withQuery(listPath, { status, page: pageToShow === 1 ? undefined : pageToShow })
        }
        messages={messages}
      />
    </div>
  );
}

function MyCouponResults({
  lang,
  myCoupons,
  isApproved,
  isFiltered,
  page,
  hrefFor,
  messages,
}: {
  lang: Locale;
  myCoupons: ReturnType<typeof useMyCoupons>;
  isApproved: boolean;
  isFiltered: boolean;
  page: number;
  hrefFor: (page: number) => string;
  messages: Messages;
}) {
  const vendorMessages = messages.coupon.vendor;
  const actions = useMyCouponActions();
  if (myCoupons.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (myCoupons.isError) {
    return (
      <PartError
        error={myCoupons.error}
        onRetry={() => void myCoupons.refetch()}
        messages={messages}
      />
    );
  }
  if (myCoupons.data.items.length === 0) {
    return (
      <StateBlock
        icon={Ticket}
        title={isFiltered ? vendorMessages.emptyFiltered : vendorMessages.empty}
        text={vendorMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <ul className="grid gap-4">
        {myCoupons.data.items.map((coupon) => (
          <li key={coupon.id}>
            <CouponCard
              coupon={coupon}
              lang={lang}
              canAccept={isApproved}
              isBusy={actions.busyId === coupon.id}
              termsChanged={actions.changedId === coupon.id}
              error={actions.errorFor(coupon.id)}
              onAccept={() => actions.accept(coupon)}
              onDisable={() => actions.disable(coupon)}
            />
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        limit={myCoupons.data.limit}
        total={myCoupons.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}

function CouponCard({
  coupon,
  lang,
  canAccept,
  isBusy,
  termsChanged,
  error,
  onAccept,
  onDisable,
}: {
  coupon: Coupon;
  lang: Locale;
  canAccept: boolean;
  isBusy: boolean;
  termsChanged: boolean;
  error: ReturnType<ReturnType<typeof useMyCouponActions>['errorFor']>;
  onAccept: () => void;
  onDisable: () => void;
}) {
  const messages = useMessages();
  const vendorMessages = messages.coupon.vendor;
  const isPending = coupon.status === CouponStatus.PendingVendor;
  const isDisabled = coupon.status === CouponStatus.Disabled;
  const headingId = `coupon-${coupon.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={headingId} className="type-h3 break-all text-ink">
          {coupon.code}
        </h2>
        <CouponStatusChip status={coupon.status} messages={messages} />
      </div>
      {termsChanged ? <Banner tone="warning">{vendorMessages.termsChanged}</Banner> : null}
      {isPending && !termsChanged ? (
        <p className="type-small text-ink-2">{vendorMessages.waitingNote}</p>
      ) : null}
      <CouponTerms coupon={coupon} lang={lang} />
      {error ? (
        <ErrorMessage
          text={messageFor(error, messages)}
          requestId={error.requestId}
          messages={messages}
        />
      ) : null}
      {isDisabled ? null : (
        <div className="flex flex-wrap gap-3">
          {isPending && canAccept ? (
            <AcceptCoupon coupon={coupon} isBusy={isBusy} onAccept={onAccept} />
          ) : null}
          <DisableCoupon coupon={coupon} isBusy={isBusy} onDisable={onDisable} />
        </div>
      )}
    </section>
  );
}

/** Accepting asks first, and says the most the vendor can pay. */
function AcceptCoupon({
  coupon,
  isBusy,
  onAccept,
}: {
  coupon: Coupon;
  isBusy: boolean;
  onAccept: () => void;
}) {
  const messages = useMessages();
  const vendorMessages = messages.coupon.vendor;
  const body =
    coupon.maxExposurePaise === null
      ? vendorMessages.acceptBodyNoLimit
      : fill(vendorMessages.acceptBody, { exposure: formatRupees(coupon.maxExposurePaise) });
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" loading={isBusy}>
          {vendorMessages.accept}
          <span className="sr-only">: {coupon.code}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fill(vendorMessages.acceptTitle, { code: coupon.code })}
          </AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>{vendorMessages.accept}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Disabling, or declining a pending coupon, asks first. */
function DisableCoupon({
  coupon,
  isBusy,
  onDisable,
}: {
  coupon: Coupon;
  isBusy: boolean;
  onDisable: () => void;
}) {
  const messages = useMessages();
  const vendorMessages = messages.coupon.vendor;
  const isPending = coupon.status === CouponStatus.PendingVendor;
  const verb = isPending ? vendorMessages.decline : vendorMessages.disable;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" loading={isBusy}>
          {verb}
          <span className="sr-only">: {coupon.code}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fill(isPending ? vendorMessages.declineTitle : vendorMessages.disableTitle, {
              code: coupon.code,
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPending ? vendorMessages.declineBody : vendorMessages.disableBody}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructiveConfirm" onClick={onDisable}>
            {verb}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
