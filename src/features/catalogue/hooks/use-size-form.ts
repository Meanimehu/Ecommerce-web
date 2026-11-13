'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import {
  CatalogueList,
  isSizeGroup,
  SizeFormSchema,
  SizeGroup,
  type AddBody,
  type ChangeBody,
  type Size,
  type SizeFormInput,
  type SizeFormValues,
} from '@/features/catalogue/types';
import { useCatalogueSave } from './use-catalogue-save';

/**
 * The size form (area-3a-catalogue.md, section 6). The code is typed only when adding; an empty
 * order is left out. The screen, `size-form.tsx`, only draws.
 */
const SIZE_FIELD_ERRORS = { codes: { [BackendErrorCode.CodeTaken]: 'code' } } as const;

export function useSizeForm({ size, onDone }: { size?: Size; onDone: () => void }) {
  const form = useAppForm<SizeFormInput, SizeFormValues>(SizeFormSchema, {
    code: size?.code ?? '',
    label: size?.label ?? '',
    sizeGroup: size && isSizeGroup(size.sizeGroup) ? size.sizeGroup : SizeGroup.Apparel,
    sortOrder: size ? String(size.sortOrder) : '',
  });
  const save = useCatalogueSave({
    list: CatalogueList.Sizes,
    form,
    fieldErrors: SIZE_FIELD_ERRORS,
    onDone,
  });

  function saveSize(values: SizeFormValues) {
    if (!size) save.addItem(newSize(values));
    else save.changeItem(size.id, changedSize(values, form.formState.dirtyFields));
  }

  return { form, saveSize, ...save };
}

export function newSize(values: SizeFormValues): AddBody<CatalogueList.Sizes> {
  return {
    code: values.code,
    label: values.label,
    sizeGroup: values.sizeGroup,
    ...(values.sortOrder === '' ? {} : { sortOrder: Number(values.sortOrder) }),
  };
}

export function changedSize(
  values: SizeFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<SizeFormInput>>>,
): ChangeBody<CatalogueList.Sizes> {
  const changes: ChangeBody<CatalogueList.Sizes> = {};
  if (dirtyFields.label) changes.label = values.label;
  if (dirtyFields.sizeGroup) changes.sizeGroup = values.sizeGroup;
  if (dirtyFields.sortOrder && values.sortOrder !== '')
    changes.sortOrder = Number(values.sortOrder);
  return changes;
}
