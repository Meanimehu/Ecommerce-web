'use client';

import type { FieldNamesMarkedBoolean } from 'react-hook-form';
import { useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import {
  BrandFormSchema,
  CatalogueList,
  type AddBody,
  type Brand,
  type BrandFormInput,
  type BrandFormValues,
  type ChangeBody,
} from '@/features/catalogue/types';
import { useCatalogueSave } from './use-catalogue-save';

/**
 * The brand form (area-3a-catalogue.md, section 5). An empty slug is left out: the backend makes
 * one from the name. The screen, `brand-form.tsx`, only draws.
 */
const BRAND_FIELD_ERRORS = {
  codes: { [BackendErrorCode.NameTaken]: 'name', [BackendErrorCode.SlugTaken]: 'slug' },
} as const;

export function useBrandForm({ brand, onDone }: { brand?: Brand; onDone: () => void }) {
  const form = useAppForm<BrandFormInput, BrandFormValues>(BrandFormSchema, {
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
  });
  const save = useCatalogueSave({
    list: CatalogueList.Brands,
    form,
    fieldErrors: BRAND_FIELD_ERRORS,
    onDone,
  });

  function saveBrand(values: BrandFormValues) {
    if (!brand) save.addItem(newBrand(values));
    else save.changeItem(brand.id, changedBrand(values, form.formState.dirtyFields));
  }

  return { form, saveBrand, ...save };
}

export function newBrand(values: BrandFormValues): AddBody<CatalogueList.Brands> {
  return { name: values.name, ...(values.slug ? { slug: values.slug } : {}) };
}

export function changedBrand(
  values: BrandFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<BrandFormInput>>>,
): ChangeBody<CatalogueList.Brands> {
  const changes: ChangeBody<CatalogueList.Brands> = {};
  if (dirtyFields.name && values.name) changes.name = values.name;
  if (dirtyFields.slug && values.slug) changes.slug = values.slug;
  return changes;
}
