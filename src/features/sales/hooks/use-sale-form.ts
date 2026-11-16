'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm, useErrorSummaryFocus } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import type { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { mySalesPath } from '@/lib/routes';
import {
  isoToIst,
  newSale,
  SaleFormSchema,
  type SaleFormInput,
  type SaleFormValues,
} from '@/features/sales/types';
import { useCreateSale } from './use-sales';

/**
 * A new sale (Document 5, section 8.2; approved Stage 5): a variant, a sale price in rupees and a
 * start and end in IST. Only the shape is checked here; whether the price is below the normal one,
 * the window and an overlap are the backend's, and each of its answers goes under its field. A sale
 * cannot be edited later. The screen, `sale-form.tsx`, only draws.
 */
const SALE_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.SalePriceInvalid]: 'salePrice',
    [BackendErrorCode.SaleWindowInvalid]: 'endsAt',
    [BackendErrorCode.SaleOverlap]: 'startsAt',
    [BackendErrorCode.VariantNotFound]: 'variantId',
  },
  fields: { salePricePaise: 'salePrice' },
} as const;

const HOUR_MS = 3_600_000;
const WEEK_MS = 7 * 24 * HOUR_MS;

export function useSaleForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const createSale = useCreateSale();
  const { focusSignal, focusErrorSummary } = useErrorSummaryFocus();
  // The starting times are worked out once, when the form opens.
  const [defaults] = useState(() => saleDefaults(Date.now()));
  const form = useAppForm<SaleFormInput, SaleFormValues>(SaleFormSchema, defaults);

  function saveSale(values: SaleFormValues) {
    createSale.mutate(newSale(values), { onSuccess: showCreated, onError: showSaveError });
  }

  function showCreated() {
    toast(messages.sales.created);
    router.push(mySalesPath(lang));
  }

  function showSaveError(error: AppError) {
    applyServerError(form, error, messages, SALE_FIELD_ERRORS);
    focusErrorSummary();
  }

  return {
    form,
    saveSale,
    showValidationErrors: focusErrorSummary,
    focusSignal,
    isSaving: createSale.isPending,
    requestId: createSale.error?.requestId,
  };
}

/** The form's starting values: from the next whole hour, for a week. */
export function saleDefaults(now: number): SaleFormInput {
  const start = Math.ceil(now / HOUR_MS) * HOUR_MS;
  return {
    variantId: '',
    salePrice: '',
    startsAt: isoToIst(new Date(start).toISOString()),
    endsAt: isoToIst(new Date(start + WEEK_MS).toISOString()),
  };
}
