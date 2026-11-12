'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/common/toast';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { useActiveHsnCodes, useAllCategories, useSaveCatalogueItem } from '@/hooks/use-catalogue';
import { fill, requestIdOf, toAppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import {
  ATTRIBUTE_TYPES,
  attributeBody,
  CategoryFormSchema,
  inTreeOrder,
  type Attribute,
  type AttributeFormInput,
  type Category,
  type CategoryFormInput,
  type HsnCode,
} from '@/types/catalogue';
import { CatalogueFormFrame, useRateOptions } from './catalogue-forms';

/**
 * Add or change a category (area-3a-catalogue.md, section 4): name, parent (up to 4 levels), slug, the default HSN code
 * and GST rate new products start with, the order, and the attributes products in it must describe. The attribute
 * list is sent whole when it changed (the backend replaces it). The backend checks every attribute together; its
 * problems are shown on the attribute they belong to.
 */
const MAX_ATTRIBUTES = 30;

const emptyAttribute: AttributeFormInput = { key: '', label: '', type: 'text', required: false, options: '', filterable: false };

function toRow(attribute: Attribute): AttributeFormInput {
  return { key: attribute.key, label: attribute.label, type: attribute.type, required: attribute.required, options: (attribute.options ?? []).join('\n'), filterable: attribute.filterable ?? false };
}

export function CategoryForm({ item, onDone }: { item?: Category; onDone: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const toast = useToast();
  const save = useSaveCatalogueItem('categories');
  const categories = useAllCategories();
  const hsnCodes = useActiveHsnCodes();
  const [focus, setFocus] = useState(0);
  const form = useAppForm<CategoryFormInput, CategoryFormInput>(CategoryFormSchema, {
    name: item?.name ?? '',
    parentId: item?.parentId ?? '',
    slug: item?.slug ?? '',
    defaultHsnCode: item?.defaultHsnCode ?? '',
    defaultGstRateBps: item?.defaultGstRateBps === null || item === undefined ? '' : String(item.defaultGstRateBps),
    sortOrder: item ? String(item.sortOrder) : '',
    attributes: (item?.attributeSchema ?? []).map(toRow),
  });
  const attributes = useFieldArray({ control: form.control, name: 'attributes' });
  const rateOptions = useRateOptions(t, item?.defaultGstRateBps);

  // A category cannot move under itself or one of its own sub-categories (the backend refuses a loop).
  const all = inTreeOrder((categories.data?.items ?? []) as Category[]);
  const below = new Set<string>(item ? [item.id] : []);
  for (const category of all) if (category.parentId && below.has(category.parentId)) below.add(category.id);
  const byId = new Map(all.map((category) => [category.id, category]));
  const pathOf = (category: Category): string => {
    const names = [category.name];
    for (let parent = category.parentId ? byId.get(category.parentId) : undefined; parent; parent = parent.parentId ? byId.get(parent.parentId) : undefined) names.unshift(parent.name);
    return names.join(' › ');
  };
  const parentOptions = [{ value: '', label: f.topLevel }, ...all.filter((category) => !below.has(category.id) && category.depth < 4).map((category) => ({ value: category.id, label: pathOf(category) }))];
  const codes = (hsnCodes.data?.items ?? []) as HsnCode[];
  const hsnOptions = [{ value: '', label: t.catalogue.none }, ...codes.map((code) => ({ value: code.code, label: `${code.code}, ${code.description}` }))];
  if (item?.defaultHsnCode && !codes.some((code) => code.code === item.defaultHsnCode)) hsnOptions.push({ value: item.defaultHsnCode, label: item.defaultHsnCode });

  const ids = { name: 'category-name', parentId: 'category-parent', slug: 'category-slug', defaultHsnCode: 'category-hsn', defaultGstRateBps: 'category-gst', sortOrder: 'category-order' } as const;

  const submit = form.handleSubmit(
    async (values) => {
      const dirty = form.formState.dirtyFields;
      const isNew = !item;
      const body: Record<string, unknown> = {};
      if (isNew || dirty.name) body.name = values.name.trim();
      if (isNew ? values.parentId !== '' : dirty.parentId) body.parentId = values.parentId || null;
      if ((isNew || dirty.slug) && values.slug.trim()) body.slug = values.slug.trim();
      if (isNew ? values.defaultHsnCode !== '' : dirty.defaultHsnCode) body.defaultHsnCode = values.defaultHsnCode || null;
      if (isNew ? values.defaultGstRateBps !== '' : dirty.defaultGstRateBps) body.defaultGstRateBps = values.defaultGstRateBps === '' ? null : Number(values.defaultGstRateBps);
      if ((isNew || dirty.sortOrder) && values.sortOrder !== '') body.sortOrder = Number(values.sortOrder);
      if (isNew ? values.attributes.length > 0 : dirty.attributes) body.attributeSchema = values.attributes.map(attributeBody);
      if (!isNew && Object.keys(body).length === 0) return onDone();
      try {
        await save.mutateAsync({ id: item?.id, body });
        toast(t.catalogue.saved);
        onDone();
      } catch (raw) {
        const error = toAppError(raw);
        if (error.code === 'ATTRIBUTE_SCHEMA_INVALID' && Array.isArray(error.details?.failures)) {
          // Each problem on its attribute; one a parent category already defines, in the summary. The backend's own
          // wording is not shown (D-09): our message names the attribute.
          for (const failure of error.details.failures as { index?: number; key?: string; categoryId?: string }[]) {
            if (typeof failure.index === 'number' && failure.index < values.attributes.length) {
              form.setError(`attributes.${failure.index}.key`, { type: 'server', message: fill(t.catalogue.attributeProblem, { number: failure.index + 1 }) });
            } else {
              form.setError(`root.attribute_${failure.key ?? ''}`, { type: 'server', message: fill(t.catalogue.attributeInParent, { key: failure.key ?? '' }) });
            }
          }
        } else {
          applyServerError(form, error, t, { codes: { SLUG_TAKEN: 'slug', CATEGORY_INVALID: 'parentId', TAX_INVALID: 'defaultHsnCode' } });
        }
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );

  // Field ids for the summary links, attribute fields included.
  const fieldIds: Record<string, string> = { ...ids };
  attributes.fields.forEach((_, index) => {
    fieldIds[`attributes.${index}.key`] = `attribute-${index}-key`;
  });

  return (
    <CatalogueFormFrame
      title={item ? `${t.catalogue.editTitle}: ${item.name}` : t.catalogue.add.categories}
      form={form}
      fieldIds={fieldIds}
      t={t}
      requestId={requestIdOf(save.error)}
      focusSignal={focus}
      busy={save.isPending}
      onCancel={onDone}
      onSubmit={() => void submit()}
    >
      <TextField form={form} name="name" id={ids.name} label={f.name} messages={t} inputProps={{ maxLength: 100 }} />
      <SelectField form={form} name="parentId" id={ids.parentId} label={f.parent} description={f.parentHelp} options={parentOptions} messages={t} />
      <TextField form={form} name="slug" id={ids.slug} label={f.slug} description={f.slugHelp} optional={!item} messages={t} inputProps={{ maxLength: 100, spellCheck: false }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField form={form} name="defaultHsnCode" id={ids.defaultHsnCode} label={f.defaultHsn} optional options={hsnOptions} messages={t} />
        <SelectField form={form} name="defaultGstRateBps" id={ids.defaultGstRateBps} label={f.defaultGst} optional options={rateOptions} messages={t} />
      </div>
      <TextField form={form} name="sortOrder" id={ids.sortOrder} label={f.sortOrder} description={f.sortOrderHelp} optional messages={t} inputProps={{ inputMode: 'numeric', maxLength: 6 }} />

      <fieldset className="grid gap-3">
        <legend className="type-h4 text-ink">{f.attributes}</legend>
        <p className="type-small text-muted-foreground">{f.attributesHelp}</p>
        {attributes.fields.map((field, index) => (
          <AttributeRow key={field.id} index={index} form={form} onRemove={() => attributes.remove(index)} />
        ))}
        {attributes.fields.length < MAX_ATTRIBUTES ? (
          <div>
            <Button type="button" variant="secondary" onClick={() => attributes.append(emptyAttribute)}>
              <Plus aria-hidden="true" />
              {f.addAttribute}
            </Button>
          </div>
        ) : null}
      </fieldset>
    </CatalogueFormFrame>
  );
}

function AttributeRow({ index, form, onRemove }: { index: number; form: ReturnType<typeof useAppForm<CategoryFormInput, CategoryFormInput>>; onRemove: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const type = form.watch(`attributes.${index}.type`);
  const number = index + 1;
  return (
    <div role="group" aria-label={fill(f.attributeNumber, { number })} className="grid gap-3 rounded-1 border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="type-label text-ink">{fill(f.attributeNumber, { number })}</p>
        <Button type="button" variant="quiet" size="small" onClick={onRemove}>
          {f.removeAttribute}
          <span className="sr-only"> {number}</span>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField form={form} name={`attributes.${index}.key`} id={`attribute-${index}-key`} label={f.attributeKey} description={f.attributeKeyHelp} messages={t} inputProps={{ maxLength: 40, spellCheck: false }} />
        <TextField form={form} name={`attributes.${index}.label`} id={`attribute-${index}-label`} label={f.attributeLabel} messages={t} inputProps={{ maxLength: 60 }} />
      </div>
      <SelectField form={form} name={`attributes.${index}.type`} id={`attribute-${index}-type`} label={f.attributeType} options={ATTRIBUTE_TYPES.map((value) => ({ value, label: t.catalogue.attributeTypes[value] }))} messages={t} />
      {type === 'choice' ? <TextareaField form={form} name={`attributes.${index}.options`} id={`attribute-${index}-options`} label={f.attributeOptions} description={f.attributeOptionsHelp} messages={t} /> : null}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
        <Checkbox {...form.register(`attributes.${index}.required`)} />
        <span>{f.attributeRequired}</span>
      </label>
      {type === 'choice' ? (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
          <Checkbox {...form.register(`attributes.${index}.filterable`)} />
          <span>{f.attributeFilterable}</span>
        </label>
      ) : null}
    </div>
  );
}
