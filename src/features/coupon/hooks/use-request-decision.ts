'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  approveBody,
  ApproveFormSchema,
  RequestDecision,
  type ApproveFormInput,
  type ApproveFormValues,
} from '@/features/coupon/types';
import { useDecideCouponRequest } from './use-coupons';

/**
 * A staff decision on a submitted coupon request (Document 5, section 8.3): admin and marketing
 * only, and never on a request the same person made (the backend refuses with
 * COUPON_REQUEST_SELF_REVIEW). Asking for changes and rejecting need a note, written in the reason
 * dialog; a refusal stays in its dialog. The request is read again after every answer. The
 * screen, `staff-request-page.tsx`, only draws.
 */
export function useRequestDecision(id: string) {
  const staffMessages = useMessages().coupon.staffRequests;
  const toast = useToast();
  const decideRequest = useDecideCouponRequest(id);

  function decideWithNote(decision: RequestDecision, done: string) {
    return (note: string, outcome: ReasonOutcome) => {
      function showDecided() {
        toast(done);
        outcome.onSuccess();
      }
      decideRequest.mutate(
        { decision, body: { note } },
        { onSuccess: showDecided, onError: outcome.onError },
      );
    };
  }

  return {
    requestChanges: decideWithNote(RequestDecision.RequestChanges, staffMessages.changesAsked),
    reject: decideWithNote(RequestDecision.Reject, staffMessages.rejected),
    isDeciding: decideRequest.isPending,
  };
}

/**
 * The approve dialog's form: the final code (empty keeps the proposed one) and a note for the
 * vendor. A code already used goes under the code; any other refusal into the dialog's summary.
 */
const APPROVE_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CouponCodeTaken]: 'code',
    [BackendErrorCode.CouponRequestInvalid]: 'code',
  },
} as const;

export function useApproveForm({ id, onClose }: { id: string; onClose: () => void }) {
  const messages = useMessages();
  const toast = useToast();
  const decideRequest = useDecideCouponRequest(id);
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const [isSending, setIsSending] = useState(false);
  const form = useAppForm<ApproveFormInput, ApproveFormValues>(ApproveFormSchema, {
    code: '',
    note: '',
  });

  function approve(values: ApproveFormValues) {
    setIsSending(true);
    decideRequest.mutate(
      { decision: RequestDecision.Approve, body: approveBody(values) },
      { onSuccess: showApproved, onError: showRefusal },
    );
  }

  function showApproved() {
    setIsSending(false);
    toast(messages.coupon.staffRequests.approved);
    onClose();
  }

  function showRefusal(error: AppError) {
    setIsSending(false);
    applyServerError(form, error, messages, APPROVE_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    submit: form.handleSubmit(approve, focusErrorSummary),
    isSending,
    focusSignal,
    requestId: decideRequest.error?.requestId,
  };
}
