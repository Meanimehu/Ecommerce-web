'use client';

import { CountTile } from '@/components/common/count-tile';
import { PartError } from '@/components/common/load-states';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myCouponRequestsPath, myCouponsPath } from '@/lib/routes';
import { withQuery } from '@/utils/url';
import { useMyCouponRequests, useMyCoupons } from '@/features/coupon/hooks/use-coupons';
import { CouponRequestStatus, CouponStatus } from '@/features/coupon/types';

/**
 * The vendor home's coupon counts (Document 5, section 7.2: "coupon requests needing a reply"):
 * requests whose changes Dhaaga asked for, and coupons waiting for the vendor to accept their
 * terms, each a link to its filtered list. The labels come from the page, because the vendor home
 * does not carry the coupon screens' text (Document 6, section 14). Each count loads, or fails, on
 * its own.
 */
const COUNT_ONLY = 1;

export function CouponAttention({
  lang,
  labels,
}: {
  lang: Locale;
  labels: { changesAsked: string; waitingAcceptance: string };
}) {
  return (
    <>
      <RequestsNeedingChanges lang={lang} label={labels.changesAsked} />
      <CouponsWaiting lang={lang} label={labels.waitingAcceptance} />
    </>
  );
}

function RequestsNeedingChanges({ lang, label }: { lang: Locale; label: string }) {
  const messages = useMessages();
  const status = CouponRequestStatus.ChangesRequested;
  const requests = useMyCouponRequests({ status, limit: COUNT_ONLY });
  if (requests.isPending) return <Skeleton className="h-20" />;
  if (requests.isError) {
    return (
      <PartError
        error={requests.error}
        onRetry={() => void requests.refetch()}
        messages={messages}
        title={label}
      />
    );
  }
  return (
    <CountTile
      count={requests.data.total}
      label={label}
      href={withQuery(myCouponRequestsPath(lang), { status })}
    />
  );
}

function CouponsWaiting({ lang, label }: { lang: Locale; label: string }) {
  const messages = useMessages();
  const status = CouponStatus.PendingVendor;
  const coupons = useMyCoupons({ status, limit: COUNT_ONLY });
  if (coupons.isPending) return <Skeleton className="h-20" />;
  if (coupons.isError) {
    return (
      <PartError
        error={coupons.error}
        onRetry={() => void coupons.refetch()}
        messages={messages}
        title={label}
      />
    );
  }
  return (
    <CountTile
      count={coupons.data.total}
      label={label}
      href={withQuery(myCouponsPath(lang), { status })}
    />
  );
}
