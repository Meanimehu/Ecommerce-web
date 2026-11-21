'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { AppError } from '@/lib/errors';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import { useMessages } from '@/lib/messages-context';
import { useDisableCoupon, useEnableCoupon } from './use-coupons';

/**
 * Disabling a coupon with a reason, and enabling it again (Document 5, section 8.3): admin and
 * marketing only. A refusal to disable shows in the reason dialog; a refusal to enable shows on the
 * page. The coupon is read again either way, so its status is the backend's. The screen,
 * `staff-coupon-page.tsx`, only draws.
 */
export function useCouponActions(id: string) {
  const staffMessages = useMessages().coupon.staff;
  const toast = useToast();
  const disableCoupon = useDisableCoupon(id);
  const enableCoupon = useEnableCoupon(id);
  const [enableError, setEnableError] = useState<AppError | null>(null);

  function disable(reason: string, outcome: ReasonOutcome) {
    function showDisabled() {
      toast(staffMessages.disabled);
      outcome.onSuccess();
    }
    disableCoupon.mutate(reason, { onSuccess: showDisabled, onError: outcome.onError });
  }

  function enable() {
    setEnableError(null);
    enableCoupon.mutate(undefined, { onSuccess: showEnabled, onError: setEnableError });
  }

  function showEnabled() {
    toast(staffMessages.enabled);
  }

  return {
    disable,
    enable,
    isDisabling: disableCoupon.isPending,
    isEnabling: enableCoupon.isPending,
    enableError,
  };
}
