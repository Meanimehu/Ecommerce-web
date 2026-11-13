'use client';

import { useState, type ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { applyServerError, useAppForm, type ServerErrorMap } from '@/hooks/use-app-form';
import { useActiveGstRates, useSaveCatalogueItem } from '@/features/catalogue/hooks/use-catalogue';
import { requestIdOf, toAppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import {
  BrandFormSchema,
  ColourFormSchema,
  HsnFormSchema,
  SIZE_GROUPS,
  SizeFormSchema,
  type Brand,
  type Colour,
  type EditableList,
  type GstRate,
  type HsnCode,
  type Size,
} from '@/types/catalogue';
import { formatRate } from '@/utils/format';

/**
 * Add and change forms for HSN codes, brands, sizes and colours (area-3a-catalogue.md, sections 3, 5 and 6). A code is
 * typed only when adding: it never changes afterwards. A change sends only the fields the person changed.
 */

/** The frame every catalogue form shares: a heading that takes focus, the error summary, the fields, Save and Cancel. */
export function CatalogueFormFrame<TValues extends FieldValues>({
  title,
  form,
  fieldIds,
  t,
  requestId,
  focusSignal,
  busy,
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  form: UseFormReturn<TValues, unknown, FieldValues>;
  fieldIds: Partial<Record<keyof TValues & string, string>> | Record<string, string>;
  t: Messages;
  requestId?: string;
  focusSignal: number;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      method="post"
      noValidate
      className="grid max-w-[720px] gap-4 rounded-1 border border-control bg-surface p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 tabIndex={-1} className="type-h3 text-ink outline-none">
        {title}
      </h2>
      <ErrorSummary form={form} fieldIds={fieldIds} messages={t} requestId={requestId} focusSignal={focusSignal} />
      {children}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" disabled={busy} onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={busy}>
          {t.catalogue.save}
        </Button>
      </div>
    </form>
  );
}

/**
 * Saving: builds the body (create: every filled field; change: only changed fields), sends it, and shows the backend's
 * refusal under the right field.
 */
function useCatalogueSave<TValues extends FieldValues>(list: EditableList, form: UseFormReturn<TValues, unknown, FieldValues>, t: Messages, map: ServerErrorMap<TValues>) {
  const save = useSaveCatalogueItem(list);
  const toast = useToast();
  const [focus, setFocus] = useState(0);
  const submit = (id: string | undefined, body: (values: TValues, dirty: Partial<Record<keyof TValues, unknown>>) => Record<string, unknown>, done: () => void) =>
    void form.handleSubmit(
      async (values) => {
        const payload = body(values as TValues, form.formState.dirtyFields as Partial<Record<keyof TValues, unknown>>);
        try {
          if (id && Object.keys(payload).length === 0) return done();
          await save.mutateAsync({ id, body: payload });
          toast(t.catalogue.saved);
          done();
        } catch (error) {
          applyServerError(form, toAppError(error), t, map);
          setFocus((n) => n + 1);
        }
      },
      () => setFocus((n) => n + 1),
    )();
  return { submit, busy: save.isPending, requestId: requestIdOf(save.error), focus };
}

/** Only what changed on an existing entry; everything filled on a new one. */
function changed<T extends Record<string, unknown>>(isNew: boolean, values: T, dirty: Partial<Record<keyof T, unknown>>, keys: readonly (keyof T)[]): (keyof T)[] {
  return keys.filter((key) => (isNew ? values[key] !== '' : Boolean(dirty[key])));
}

/** GST-rate choices: the active rates, plus the current one if it has since been switched off. */
export function useRateOptions(t: Messages, current: number | null | undefined) {
  const rates = useActiveGstRates();
  const items = (rates.data?.items ?? []) as GstRate[];
  const options = items.map((rate) => ({ value: String(rate.rateBps), label: rate.label }));
  if (current !== null && current !== undefined && !items.some((rate) => rate.rateBps === current)) options.push({ value: String(current), label: formatRate(current) });
  return [{ value: '', label: t.catalogue.none }, ...options];
}

export function HsnForm({ item, onDone }: { item?: HsnCode; onDone: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const form = useAppForm(HsnFormSchema, { code: item?.code ?? '', description: item?.description ?? '', defaultGstRateBps: item?.defaultGstRateBps === null || item === undefined ? '' : String(item.defaultGstRateBps) });
  const ids = { code: 'hsn-code', description: 'hsn-description', defaultGstRateBps: 'hsn-gst' } as const;
  const { submit, busy, requestId, focus } = useCatalogueSave('hsn-codes', form, t, { codes: { CODE_TAKEN: 'code', TAX_INVALID: 'defaultGstRateBps' } });
  const rateOptions = useRateOptions(t, item?.defaultGstRateBps);
  return (
    <CatalogueFormFrame
      title={item ? `${t.catalogue.editTitle}: ${item.code}` : t.catalogue.add['hsn-codes']}
      form={form}
      fieldIds={ids}
      t={t}
      requestId={requestId}
      focusSignal={focus}
      busy={busy}
      onCancel={onDone}
      onSubmit={() =>
        submit(
          item?.id,
          (values, dirty) => {
            const body: Record<string, unknown> = {};
            for (const key of changed(!item, values, dirty, ['code', 'description', 'defaultGstRateBps'] as const)) {
              if (key === 'code' && item) continue;
              body[key] = key === 'defaultGstRateBps' ? (values[key] === '' ? null : Number(values[key])) : values[key].trim();
            }
            return body;
          },
          onDone,
        )
      }
    >
      {item ? (
        <ReadOnly label={f.code} value={item.code} help={f.codeFixed} />
      ) : (
        <TextField form={form} name="code" id={ids.code} label={f.hsnCode} description={f.hsnCodeHelp} messages={t} inputProps={{ inputMode: 'numeric', maxLength: 8 }} />
      )}
      <TextField form={form} name="description" id={ids.description} label={f.description} messages={t} inputProps={{ maxLength: 300 }} />
      <SelectField form={form} name="defaultGstRateBps" id={ids.defaultGstRateBps} label={f.defaultGst} optional options={rateOptions} messages={t} />
    </CatalogueFormFrame>
  );
}

export function BrandForm({ item, onDone }: { item?: Brand; onDone: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const form = useAppForm(BrandFormSchema, { name: item?.name ?? '', slug: item?.slug ?? '' });
  const ids = { name: 'brand-name', slug: 'brand-slug' } as const;
  const { submit, busy, requestId, focus } = useCatalogueSave('brands', form, t, { codes: { NAME_TAKEN: 'name', SLUG_TAKEN: 'slug' } });
  return (
    <CatalogueFormFrame
      title={item ? `${t.catalogue.editTitle}: ${item.name}` : t.catalogue.add.brands}
      form={form}
      fieldIds={ids}
      t={t}
      requestId={requestId}
      focusSignal={focus}
      busy={busy}
      onCancel={onDone}
      onSubmit={() =>
        submit(
          item?.id,
          (values, dirty) => {
            const body: Record<string, unknown> = {};
            for (const key of changed(!item, values, dirty, ['name', 'slug'] as const)) if (values[key].trim()) body[key] = values[key].trim();
            return body;
          },
          onDone,
        )
      }
    >
      <TextField form={form} name="name" id={ids.name} label={f.name} messages={t} inputProps={{ maxLength: 100 }} />
      <TextField form={form} name="slug" id={ids.slug} label={f.slug} description={f.slugHelp} optional={!item} messages={t} inputProps={{ maxLength: 100, spellCheck: false }} />
    </CatalogueFormFrame>
  );
}

export function SizeForm({ item, onDone }: { item?: Size; onDone: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const form = useAppForm(SizeFormSchema, { code: item?.code ?? '', label: item?.label ?? '', sizeGroup: item?.sizeGroup ?? 'apparel', sortOrder: item ? String(item.sortOrder) : '' });
  const ids = { code: 'size-code', label: 'size-label', sizeGroup: 'size-group', sortOrder: 'size-order' } as const;
  const { submit, busy, requestId, focus } = useCatalogueSave('sizes', form, t, { codes: { CODE_TAKEN: 'code' } });
  return (
    <CatalogueFormFrame
      title={item ? `${t.catalogue.editTitle}: ${item.code}` : t.catalogue.add.sizes}
      form={form}
      fieldIds={ids}
      t={t}
      requestId={requestId}
      focusSignal={focus}
      busy={busy}
      onCancel={onDone}
      onSubmit={() =>
        submit(
          item?.id,
          (values, dirty) => {
            const body: Record<string, unknown> = {};
            for (const key of changed(!item, values, dirty, ['code', 'label', 'sizeGroup', 'sortOrder'] as const)) {
              if (key === 'code' && item) continue;
              if (key === 'sortOrder') {
                if (values.sortOrder !== '') body.sortOrder = Number(values.sortOrder);
              } else body[key] = values[key].trim();
            }
            return body;
          },
          onDone,
        )
      }
    >
      {item ? (
        <ReadOnly label={f.code} value={item.code} help={f.codeFixed} />
      ) : (
        <TextField form={form} name="code" id={ids.code} label={f.code} description={f.sizeCodeHelp} messages={t} inputProps={{ maxLength: 12, autoCapitalize: 'characters', className: 'uppercase' }} />
      )}
      <TextField form={form} name="label" id={ids.label} label={f.label} messages={t} inputProps={{ maxLength: 50 }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField form={form} name="sizeGroup" id={ids.sizeGroup} label={f.sizeGroup} options={SIZE_GROUPS.map((value) => ({ value, label: t.catalogue.sizeGroups[value] }))} messages={t} />
        <TextField form={form} name="sortOrder" id={ids.sortOrder} label={f.sortOrder} description={f.sortOrderHelp} optional messages={t} inputProps={{ inputMode: 'numeric', maxLength: 6 }} />
      </div>
    </CatalogueFormFrame>
  );
}

export function ColourForm({ item, onDone }: { item?: Colour; onDone: () => void }) {
  const t = useMessages();
  const f = t.catalogue.fields;
  const form = useAppForm(ColourFormSchema, { code: item?.code ?? '', label: item?.label ?? '', hex: item?.hex ?? '' });
  const ids = { code: 'colour-code', label: 'colour-label', hex: 'colour-hex' } as const;
  const { submit, busy, requestId, focus } = useCatalogueSave('colours', form, t, { codes: { CODE_TAKEN: 'code' } });
  const hex = form.watch('hex');
  return (
    <CatalogueFormFrame
      title={item ? `${t.catalogue.editTitle}: ${item.code}` : t.catalogue.add.colours}
      form={form}
      fieldIds={ids}
      t={t}
      requestId={requestId}
      focusSignal={focus}
      busy={busy}
      onCancel={onDone}
      onSubmit={() =>
        submit(
          item?.id,
          (values, dirty) => {
            const body: Record<string, unknown> = {};
            for (const key of changed(!item, values, dirty, ['code', 'label', 'hex'] as const)) {
              if (key === 'code' && item) continue;
              body[key] = key === 'hex' && values.hex.trim() === '' ? null : values[key].trim();
            }
            return body;
          },
          onDone,
        )
      }
    >
      {item ? (
        <ReadOnly label={f.code} value={item.code} help={f.codeFixed} />
      ) : (
        <TextField form={form} name="code" id={ids.code} label={f.code} description={f.colourCodeHelp} messages={t} inputProps={{ maxLength: 20, autoCapitalize: 'characters', className: 'uppercase' }} />
      )}
      <TextField form={form} name="label" id={ids.label} label={f.label} messages={t} inputProps={{ maxLength: 50 }} />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField form={form} name="hex" id={ids.hex} label={f.hex} description={f.hexHelp} optional messages={t} inputProps={{ maxLength: 7, spellCheck: false }} />
        </div>
        <span aria-hidden="true" className="mb-7 size-11 shrink-0 rounded-2 border border-control" style={/^#[0-9a-fA-F]{6}$/.test(hex) ? { background: hex } : undefined} />
      </div>
    </CatalogueFormFrame>
  );
}

/** A value that cannot be changed, shown as plain information (Document 6, 8.1, read-only). */
export function ReadOnly({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="grid gap-1.5">
      <p className="type-label text-ink">{label}</p>
      <p className="rounded-2 bg-sunken px-3.5 py-2.5 text-ink">{value}</p>
      {help ? <p className="type-small text-muted-foreground">{help}</p> : null}
    </div>
  );
}
