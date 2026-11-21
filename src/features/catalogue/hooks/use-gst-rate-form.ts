'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import {
  CatalogueList,
  GstRateFormSchema,
  percentToBps,
  type AddBody,
  type ChangeBody,
  type GstRate,
  type GstRateFormInput,
  type GstRateFormValues,
} from '@/features/catalogue/types';
import { useCatalogueSave } from './use-catalogue-save';

/**
 * The GST rate form (area-3a-catalogue.md, GST rates). A new rate is typed as a percentage and
 * sent in basis points; an empty label is left out, and the backend names it ("5%"). A rate itself
 * never changes: only its label can be changed later, and it is switched off or on in the list. The
 * screen, `gst-rate-form.tsx`, only draws.
 */
const GST_RATE_FIELD_ERRORS = {
  codes: { [BackendErrorCode.CodeTaken]: 'rate' },
  fields: { rateBps: 'rate' },
} as const;

export function useGstRateForm({ rate, onDone }: { rate?: GstRate; onDone: () => void }) {
  const form = useAppForm<GstRateFormInput, GstRateFormValues>(GstRateFormSchema, {
    rate: rate ? String(rate.rateBps / 100) : '',
    label: rate?.label ?? '',
  });
  const save = useCatalogueSave({
    list: CatalogueList.GstRates,
    form,
    fieldErrors: GST_RATE_FIELD_ERRORS,
    onDone,
  });

  function saveGstRate(values: GstRateFormValues) {
    if (!rate) save.addItem(newGstRate(values));
    else save.changeItem(rate.id, changedGstRate(values, form.formState.dirtyFields));
  }

  return { form, saveGstRate, ...save };
}

export function newGstRate(values: GstRateFormValues): AddBody<CatalogueList.GstRates> {
  return {
    rateBps: percentToBps(values.rate),
    ...(values.label ? { label: values.label } : {}),
  };
}

/** Only a changed, non-empty label is sent: the rate itself cannot change. */
export function changedGstRate(
  values: GstRateFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<GstRateFormInput>>>,
): ChangeBody<CatalogueList.GstRates> {
  return dirtyFields.label && values.label ? { label: values.label } : {};
}
