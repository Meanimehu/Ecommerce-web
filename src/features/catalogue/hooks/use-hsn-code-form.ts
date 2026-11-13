'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import {
  CatalogueList,
  HsnCodeFormSchema,
  rateField,
  rateValue,
  type AddBody,
  type ChangeBody,
  type HsnCode,
  type HsnCodeFormInput,
  type HsnCodeFormValues,
} from '@/features/catalogue/types';
import { useCatalogueSave } from './use-catalogue-save';
import { useGstRateOptions } from './use-gst-rate-options';

/**
 * The HSN code form (area-3a-catalogue.md, section 3). The code is typed only when adding; it never
 * changes afterwards. The screen, `hsn-code-form.tsx`, only draws.
 */
const HSN_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.CodeTaken]: 'code',
    [BackendErrorCode.TaxInvalid]: 'defaultGstRateBps',
  },
} as const;

export function useHsnCodeForm({ hsnCode, onDone }: { hsnCode?: HsnCode; onDone: () => void }) {
  const form = useAppForm<HsnCodeFormInput, HsnCodeFormValues>(HsnCodeFormSchema, {
    code: hsnCode?.code ?? '',
    description: hsnCode?.description ?? '',
    defaultGstRateBps: rateField(hsnCode?.defaultGstRateBps),
  });
  const save = useCatalogueSave({
    list: CatalogueList.HsnCodes,
    form,
    fieldErrors: HSN_FIELD_ERRORS,
    onDone,
  });
  const gstRateOptions = useGstRateOptions(hsnCode?.defaultGstRateBps);

  function saveHsnCode(values: HsnCodeFormValues) {
    if (!hsnCode) save.addItem(newHsnCode(values));
    else save.changeItem(hsnCode.id, changedHsnCode(values, form.formState.dirtyFields));
  }

  return { form, saveHsnCode, gstRateOptions, ...save };
}

export function newHsnCode(values: HsnCodeFormValues): AddBody<CatalogueList.HsnCodes> {
  return {
    code: values.code,
    description: values.description,
    ...(values.defaultGstRateBps === ''
      ? {}
      : { defaultGstRateBps: rateValue(values.defaultGstRateBps) }),
  };
}

export function changedHsnCode(
  values: HsnCodeFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<HsnCodeFormInput>>>,
): ChangeBody<CatalogueList.HsnCodes> {
  const changes: ChangeBody<CatalogueList.HsnCodes> = {};
  if (dirtyFields.description) changes.description = values.description;
  if (dirtyFields.defaultGstRateBps)
    changes.defaultGstRateBps = rateValue(values.defaultGstRateBps);
  return changes;
}
