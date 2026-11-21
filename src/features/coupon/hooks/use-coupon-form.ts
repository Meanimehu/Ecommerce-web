'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import { messageFor, type AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponPath } from '@/lib/routes';
import {
  changedCoupon,
  CouponFormSchema,
  couponFormDefaults,
  newCoupon,
  type Coupon,
  type CouponFormInput,
  type CouponFormValues,
} from '@/features/coupon/types';
import { useChangeCoupon, useCreateCoupon } from './use-coupons';

/**
 * The staff's coupon form (Document 5, section 8.3; area-5-sales-cart-coupons.md, part 3): a new
 * coupon, or a change to one. Only shapes are checked here; whether the terms fit together, and
 * what may still change once a coupon is used or accepted, are the backend's, and each answer goes
 * under its field. A change sends only the changed terms, and the code never changes. The screen,
 * `coupon-form.tsx`, only draws.
 */
const COUPON_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CouponCodeTaken]: 'code',
    [BackendErrorCode.CouponLimitBelowUsage]: 'usageLimit',
    [BackendErrorCode.VendorNotFound]: 'vendorId',
    [BackendErrorCode.CategoryNotFound]: 'categoryIds',
    [BackendErrorCode.ProductNotFound]: 'productIds',
  },
  fields: {
    maxDiscountPaise: 'maxDiscount',
    minCartPaise: 'minCart',
    marketplaceShareBps: 'marketplaceShare',
  },
} as const;

/** The form field of each backend term, for a term the backend names as locked. */
const TERM_FIELD: Record<string, keyof CouponFormInput> = {
  discountType: 'discountType',
  value: 'value',
  maxDiscountPaise: 'maxDiscount',
  minCartPaise: 'minCart',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  usageLimit: 'usageLimit',
  perUserLimit: 'perUserLimit',
  excludeSaleItems: 'excludeSaleItems',
  fundedBy: 'fundedBy',
  vendorId: 'vendorId',
  marketplaceShareBps: 'marketplaceShare',
  categoryIds: 'categoryIds',
  productIds: 'productIds',
};

export function useCouponForm({ lang, coupon }: { lang: Locale; coupon?: Coupon }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const createCoupon = useCreateCoupon();
  const changeCoupon = useChangeCoupon(coupon?.id ?? '');
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  const form = useAppForm<CouponFormInput, CouponFormValues>(
    CouponFormSchema,
    couponFormDefaults(coupon),
  );
  const saving = coupon ? changeCoupon : createCoupon;

  function saveCoupon(values: CouponFormValues) {
    if (!coupon) {
      createCoupon.mutate(newCoupon(values), { onSuccess: showSaved, onError: showSaveError });
      return;
    }
    const body = changedCoupon(values, form.formState.dirtyFields);
    if (Object.keys(body).length === 0) {
      form.setError('root.server', {
        type: 'server',
        message: messages.coupon.fields.nothingChanged,
      });
      focusErrorSummary();
      return;
    }
    changeCoupon.mutate(body, { onSuccess: showSaved, onError: showSaveError });
  }

  function showSaved(saved: Coupon) {
    toast(coupon ? messages.coupon.staff.saved : messages.coupon.staff.created);
    router.push(adminCouponPath(lang, saved.id));
  }

  function showSaveError(error: AppError) {
    const lockedField = lockedFieldOf(error);
    if (lockedField)
      form.setError(lockedField, { type: 'server', message: messageFor(error, messages) });
    else applyServerError(form, error, messages, COUPON_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    saveCoupon,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: saving.isPending,
    requestId: saving.error?.requestId,
  };
}

/** The field of the term the backend names as locked (COUPON_LOCKED, `details.term`). */
function lockedFieldOf(error: AppError): keyof CouponFormInput | undefined {
  if (error.code !== BackendErrorCode.CouponLocked) return undefined;
  const term = error.details?.term;
  return typeof term === 'string' ? TERM_FIELD[term] : undefined;
}
