'use client';

import { useFieldArray, type FieldNamesMarkedBoolean } from 'react-hook-form';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, type AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  AttributeType,
  attributeBody,
  CatalogueList,
  CategoryFormSchema,
  inTreeOrder,
  MAX_CATEGORY_DEPTH,
  rateField,
  rateValue,
  type AddBody,
  type Attribute,
  type AttributeFormInput,
  type Category,
  type CategoryFormInput,
  type CategoryFormValues,
  type ChangeBody,
} from '@/features/catalogue/types';
import { useActiveHsnCodes, useAllCategories } from './use-catalogue';
import { useCatalogueSave } from './use-catalogue-save';
import { useGstRateOptions } from './use-gst-rate-options';

/**
 * The category form (area-3a-catalogue.md, section 4): name, parent (up to 4 levels), slug, the
 * default HSN code and GST rate new products start with, the order, and the attributes products in
 * it must describe. The attribute list is sent whole when it changed (the backend replaces it). The
 * backend checks every attribute together; its problems are shown on the attribute they belong to.
 * The screen, `category-form.tsx`, only draws.
 */
export const MAX_ATTRIBUTES = 30;

export const EMPTY_ATTRIBUTE: AttributeFormInput = {
  key: '',
  label: '',
  type: AttributeType.Text,
  required: false,
  options: '',
  filterable: false,
};

const CATEGORY_FIELD_ERRORS = {
  codes: {
    [BackendErrorCode.SlugTaken]: 'slug',
    [BackendErrorCode.CategoryInvalid]: 'parentId',
    [BackendErrorCode.TaxInvalid]: 'defaultHsnCode',
  },
} as const;

/** One problem the backend found in the attribute list (ATTRIBUTE_SCHEMA_INVALID). */
interface AttributeFailure {
  index?: number;
  key?: string;
}

export function useCategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const messages = useMessages();
  const allCategories = useAllCategories();
  const activeHsnCodes = useActiveHsnCodes();
  const form = useAppForm<CategoryFormInput, CategoryFormValues>(CategoryFormSchema, {
    name: category?.name ?? '',
    parentId: category?.parentId ?? '',
    slug: category?.slug ?? '',
    defaultHsnCode: category?.defaultHsnCode ?? '',
    defaultGstRateBps: rateField(category?.defaultGstRateBps),
    sortOrder: category ? String(category.sortOrder) : '',
    attributes: (category?.attributeSchema ?? []).map(attributeRow),
  });
  const attributes = useFieldArray({ control: form.control, name: 'attributes' });
  const gstRateOptions = useGstRateOptions(category?.defaultGstRateBps);
  const save = useCatalogueSave({
    list: CatalogueList.Categories,
    form,
    showError: showCategoryError,
    onDone,
  });

  const categories = inTreeOrder(allCategories.data?.items ?? []);
  const hsnCodes = activeHsnCodes.data?.items ?? [];
  const parentOptions = [
    { value: '', label: messages.catalogue.fields.topLevel },
    ...possibleParents(categories, category).map((parent) => ({
      value: parent.id,
      label: pathOf(parent, categories),
    })),
  ];
  const hsnOptions = [
    { value: '', label: messages.catalogue.none },
    ...hsnCodes.map((hsnCode) => ({
      value: hsnCode.code,
      label: `${hsnCode.code}, ${hsnCode.description}`,
    })),
  ];
  // A default HSN code since switched off is still shown, so the form keeps it.
  const currentHsnCode = category?.defaultHsnCode;
  if (currentHsnCode && !hsnCodes.some((hsnCode) => hsnCode.code === currentHsnCode)) {
    hsnOptions.push({ value: currentHsnCode, label: currentHsnCode });
  }

  function saveCategory(values: CategoryFormValues) {
    if (!category) save.addItem(newCategory(values));
    else save.changeItem(category.id, changedCategory(values, form.formState.dirtyFields));
  }

  function showCategoryError(error: AppError) {
    const failures = error.details?.failures;
    if (error.code !== BackendErrorCode.AttributeSchemaInvalid || !Array.isArray(failures)) {
      applyServerError(form, error, messages, CATEGORY_FIELD_ERRORS);
      return;
    }
    // Each problem on its attribute; one a parent category already defines, in the summary. The
    // backend's own wording is not shown (D-09): our message names the attribute.
    const attributeCount = form.getValues('attributes').length;
    for (const failure of failures as AttributeFailure[]) {
      if (typeof failure.index === 'number' && failure.index < attributeCount) {
        form.setError(`attributes.${failure.index}.key`, {
          type: 'server',
          message: fill(messages.catalogue.attributeProblem, { number: failure.index + 1 }),
        });
      } else {
        form.setError(`root.attribute_${failure.key ?? ''}`, {
          type: 'server',
          message: fill(messages.catalogue.attributeInParent, { key: failure.key ?? '' }),
        });
      }
    }
  }

  return {
    form,
    attributes,
    saveCategory,
    parentOptions,
    hsnOptions,
    gstRateOptions,
    canAddAttribute: attributes.fields.length < MAX_ATTRIBUTES,
    addAttribute: () => attributes.append(EMPTY_ATTRIBUTE),
    ...save,
  };
}

function attributeRow(attribute: Attribute): AttributeFormInput {
  return {
    key: attribute.key,
    label: attribute.label,
    type: attribute.type,
    required: attribute.required,
    options: (attribute.options ?? []).join('\n'),
    filterable: attribute.filterable ?? false,
  };
}

/**
 * The categories this one may move under: not itself or one of its own sub-categories (the backend
 * refuses a loop), and not one already at the deepest level. `categories` is in tree order, so a
 * parent always comes before its children.
 */
export function possibleParents(categories: readonly Category[], category?: Category): Category[] {
  const ownBranch = new Set<string>(category ? [category.id] : []);
  for (const candidate of categories) {
    if (candidate.parentId && ownBranch.has(candidate.parentId)) ownBranch.add(candidate.id);
  }
  return categories.filter(
    (candidate) => !ownBranch.has(candidate.id) && candidate.depth < MAX_CATEGORY_DEPTH,
  );
}

/** A category's full path for the parent choice, for example "Women › Ethnic › Kurtas". */
export function pathOf(category: Category, categories: readonly Category[]): string {
  const byId = new Map(categories.map((known) => [known.id, known]));
  const names = [category.name];
  let parent = category.parentId ? byId.get(category.parentId) : undefined;
  while (parent) {
    names.unshift(parent.name);
    parent = parent.parentId ? byId.get(parent.parentId) : undefined;
  }
  return names.join(' › ');
}

export function newCategory(values: CategoryFormValues): AddBody<CatalogueList.Categories> {
  return {
    name: values.name,
    ...(values.parentId === '' ? {} : { parentId: values.parentId }),
    ...(values.slug ? { slug: values.slug } : {}),
    ...(values.defaultHsnCode === '' ? {} : { defaultHsnCode: values.defaultHsnCode }),
    ...(values.defaultGstRateBps === ''
      ? {}
      : { defaultGstRateBps: rateValue(values.defaultGstRateBps) }),
    ...(values.sortOrder === '' ? {} : { sortOrder: Number(values.sortOrder) }),
    ...(values.attributes.length > 0
      ? { attributeSchema: values.attributes.map(attributeBody) }
      : {}),
  };
}

export function changedCategory(
  values: CategoryFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<CategoryFormInput>>>,
): ChangeBody<CatalogueList.Categories> {
  const changes: ChangeBody<CatalogueList.Categories> = {};
  if (dirtyFields.name) changes.name = values.name;
  if (dirtyFields.parentId) changes.parentId = values.parentId || null;
  if (dirtyFields.slug && values.slug) changes.slug = values.slug;
  if (dirtyFields.defaultHsnCode) changes.defaultHsnCode = values.defaultHsnCode || null;
  if (dirtyFields.defaultGstRateBps)
    changes.defaultGstRateBps = rateValue(values.defaultGstRateBps);
  if (dirtyFields.sortOrder && values.sortOrder !== '')
    changes.sortOrder = Number(values.sortOrder);
  if (dirtyFields.attributes) changes.attributeSchema = values.attributes.map(attributeBody);
  return changes;
}
