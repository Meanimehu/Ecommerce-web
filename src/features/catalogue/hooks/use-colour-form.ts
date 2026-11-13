'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import {
  CatalogueList,
  ColourFormSchema,
  type AddBody,
  type ChangeBody,
  type Colour,
  type ColourFormInput,
  type ColourFormValues,
} from '@/features/catalogue/types';
import { useCatalogueSave } from './use-catalogue-save';

/**
 * The colour form (area-3a-catalogue.md, section 6). The code is typed only when adding; an emptied
 * hex value is removed with null. The screen, `colour-form.tsx`, only draws.
 */
const COLOUR_FIELD_ERRORS = { codes: { [BackendErrorCode.CodeTaken]: 'code' } } as const;

export function useColourForm({ colour, onDone }: { colour?: Colour; onDone: () => void }) {
  const form = useAppForm<ColourFormInput, ColourFormValues>(ColourFormSchema, {
    code: colour?.code ?? '',
    label: colour?.label ?? '',
    hex: colour?.hex ?? '',
  });
  const save = useCatalogueSave({
    list: CatalogueList.Colours,
    form,
    fieldErrors: COLOUR_FIELD_ERRORS,
    onDone,
  });

  function saveColour(values: ColourFormValues) {
    if (!colour) save.addItem(newColour(values));
    else save.changeItem(colour.id, changedColour(values, form.formState.dirtyFields));
  }

  return { form, saveColour, ...save };
}

export function newColour(values: ColourFormValues): AddBody<CatalogueList.Colours> {
  return { code: values.code, label: values.label, ...(values.hex ? { hex: values.hex } : {}) };
}

export function changedColour(
  values: ColourFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<ColourFormInput>>>,
): ChangeBody<CatalogueList.Colours> {
  const changes: ChangeBody<CatalogueList.Colours> = {};
  if (dirtyFields.label) changes.label = values.label;
  if (dirtyFields.hex) changes.hex = values.hex === '' ? null : values.hex;
  return changes;
}
