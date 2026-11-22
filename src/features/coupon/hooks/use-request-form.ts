'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myCouponRequestPath } from '@/lib/routes';
import {
  changedCouponRequest,
  newCouponRequest,
  RequestFormSchema,
  requestFormDefaults,
  type CouponRequest,
  type RequestFormInput,
  type RequestFormValues,
} from '@/features/coupon/types';
import { useChangeCouponRequest, useCreateCouponRequest } from './use-coupons';

/**
 * The vendor's coupon request form (Document 5, section 8.2; area-5-sales-cart-coupons.md, part
 * 4): a new request, saved as a draft, or a change to a draft or a request whose changes were asked
 * for. Only shapes, and the cap a percentage needs, are checked here; the backend's limits and
 * rules are its own, and its answer goes under the field it names. A change sends only what
 * changed. Sending for review is a separate button on the request. The screen, `request-form.tsx`,
 * only draws.
 */
const REQUEST_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CouponRequestProductInvalid]: 'productIds',
    [BackendErrorCode.CategoryNotFound]: 'categoryIds',
  },
  fields: {
    maxDiscountPaise: 'maxDiscount',
    minCartPaise: 'minCart',
  },
} as const;

export function useRequestForm({ lang, request }: { lang: Locale; request?: CouponRequest }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const createRequest = useCreateCouponRequest();
  const changeRequest = useChangeCouponRequest(request?.id ?? '');
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  // A new request's times are worked out once, when the form opens.
  const [defaults] = useState(() => requestFormDefaults(request));
  const form = useAppForm<RequestFormInput, RequestFormValues>(RequestFormSchema, defaults);
  const saving = request ? changeRequest : createRequest;

  function saveRequest(values: RequestFormValues) {
    if (!request) {
      createRequest.mutate(newCouponRequest(values), {
        onSuccess: showSaved,
        onError: showSaveError,
      });
      return;
    }
    const body = changedCouponRequest(values, form.formState.dirtyFields);
    if (Object.keys(body).length === 0) {
      form.setError('root.server', {
        type: 'server',
        message: messages.coupon.fields.nothingChanged,
      });
      focusErrorSummary();
      return;
    }
    changeRequest.mutate(body, { onSuccess: showSaved, onError: showSaveError });
  }

  function showSaved(saved: CouponRequest) {
    toast(request ? messages.coupon.requests.saved : messages.coupon.requests.created);
    router.push(myCouponRequestPath(lang, saved.id));
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, REQUEST_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    saveRequest,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: saving.isPending,
    requestId: saving.error?.requestId,
  };
}
