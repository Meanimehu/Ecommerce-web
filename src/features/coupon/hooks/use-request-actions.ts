'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { useSubmitCouponRequest, useWithdrawCouponRequest } from './use-coupons';

/**
 * A vendor sends a coupon request for review, or withdraws it (Document 5, section 8.2). The
 * backend checks the terms again on sending; a refusal shows on the page. The request is read again
 * after every answer, so its status and history are the backend's. The screen,
 * `my-request-page.tsx`, only draws.
 */
export function useRequestActions(id: string) {
  const requestMessages = useMessages().coupon.requests;
  const toast = useToast();
  const submitRequest = useSubmitCouponRequest(id);
  const withdrawRequest = useWithdrawCouponRequest(id);
  const [actionError, setActionError] = useState<AppError | null>(null);

  function submit() {
    setActionError(null);
    submitRequest.mutate(undefined, { onSuccess: showSubmitted, onError: setActionError });
  }

  function withdraw() {
    setActionError(null);
    withdrawRequest.mutate(undefined, { onSuccess: showWithdrawn, onError: setActionError });
  }

  function showSubmitted() {
    toast(requestMessages.submitted);
  }

  function showWithdrawn() {
    toast(requestMessages.withdrawn);
  }

  return {
    submit,
    withdraw,
    isSubmitting: submitRequest.isPending,
    isWithdrawing: withdrawRequest.isPending,
    actionError,
  };
}
