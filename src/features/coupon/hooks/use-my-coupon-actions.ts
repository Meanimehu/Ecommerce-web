'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import type { Coupon } from '@/features/coupon/types';
import { useAcceptMyCoupon, useDisableMyCoupon } from './use-coupons';

/**
 * A vendor accepts a coupon's terms, or disables it (Document 5, section 8.2): accepting sends the
 * fingerprint of the exact terms on screen, so terms changed in the meantime are refused
 * (COUPON_TERMS_CHANGED); the list is then read again, the new terms are shown with a note, and
 * nothing is accepted until the vendor presses again. Disabling a pending coupon declines it. The
 * list is read again after every answer. The screen, `my-coupon-list.tsx`, only draws.
 */
export function useMyCouponActions() {
  const vendorMessages = useMessages().coupon.vendor;
  const toast = useToast();
  const acceptMyCoupon = useAcceptMyCoupon();
  const disableMyCoupon = useDisableMyCoupon();
  const [changedId, setChangedId] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ id: string; error: AppError } | null>(null);

  function accept(coupon: Coupon) {
    setChangedId(null);
    setFailed(null);
    function showAccepted() {
      toast(vendorMessages.accepted);
    }
    function showAcceptError(error: AppError) {
      if (error.code === BackendErrorCode.CouponTermsChanged) setChangedId(coupon.id);
      else setFailed({ id: coupon.id, error });
    }
    acceptMyCoupon.mutate(
      { id: coupon.id, termsDigest: coupon.termsDigest },
      { onSuccess: showAccepted, onError: showAcceptError },
    );
  }

  function disable(coupon: Coupon) {
    setChangedId(null);
    setFailed(null);
    function showDisabled() {
      toast(vendorMessages.disabled);
    }
    function showDisableError(error: AppError) {
      setFailed({ id: coupon.id, error });
    }
    disableMyCoupon.mutate(coupon.id, { onSuccess: showDisabled, onError: showDisableError });
  }

  /** The coupon whose answer is awaited, if any. */
  function busyIdOf(): string | undefined {
    if (acceptMyCoupon.isPending) return acceptMyCoupon.variables.id;
    if (disableMyCoupon.isPending) return disableMyCoupon.variables;
    return undefined;
  }

  return {
    accept,
    disable,
    busyId: busyIdOf(),
    changedId,
    errorFor: (id: string) => (failed?.id === id ? failed.error : null),
  };
}
