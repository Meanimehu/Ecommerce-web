'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { useChangeProduct } from '@/hooks/use-product';
import { requestIdOf, toAppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { Attribute } from '@/types/catalogue';
import { flattenCategories, type Dictionaries, type ProductView } from '@/types/product';

/**
 * Step 2, attributes (Document 5, section 7.3): the fields come from the category the backend sends, its parents'
 * attributes included. Required ones may be left empty while the product is a draft; the review step lists them
 * (area-3b-products.md, POST /vendors/me/products). The backend checks each value; its problems show on the field.
 */
type Values = Record<string, string>;

function attributeSchema(attributes: readonly Attribute[]) {
  return z.object(
    Object.fromEntries(
      attributes.map((a) => [a.key, a.type === 'number' ? z.string().trim().regex(/^(-?\d+(\.\d+)?)?$/, 'validation.number') : z.string().trim()]),
    ),
  );
}

export function AttributesStep({ lang, product, dictionaries }: { lang: Locale; product: ProductView; dictionaries: Dictionaries }) {
  const t = useMessages();
  const p = t.product;
  const category = flattenCategories(dictionaries.categories).find((c) => c.category.id === product.categoryId)?.category;
  const attributes = category?.attributes ?? [];
  const next = `/${lang}/vendor/products/${product.id}?step=variants`;

  if (attributes.length === 0) {
    return (
      <section className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{p.steps.attributes}</h2>
        <p className="text-ink-2">{category ? p.noAttributes : p.categoryInactive}</p>
        <div className="flex justify-end">
          <Button asChild>
            <Link href={next} className="no-underline">
              {p.continue}
            </Link>
          </Button>
        </div>
      </section>
    );
  }
  return <AttributesForm product={product} attributes={attributes} next={next} />;
}

function AttributesForm({ product, attributes, next }: { product: ProductView; attributes: readonly Attribute[]; next: string }) {
  const t = useMessages();
  const p = t.product;
  const router = useRouter();
  const toast = useToast();
  const change = useChangeProduct(product.id);
  const [focus, setFocus] = useState(0);
  const defaults: Values = Object.fromEntries(attributes.map((a) => [a.key, product.attributes[a.key] === undefined || product.attributes[a.key] === null ? '' : String(product.attributes[a.key])]));
  const form = useAppForm<Values, Values>(attributeSchema(attributes) as unknown as z.ZodType<Values, Values>, defaults);
  const ids = Object.fromEntries(attributes.map((a) => [a.key, `attribute-${a.key}`]));

  const submit = form.handleSubmit(
    async (values) => {
      // The backend replaces all values: every filled one is sent, an empty one is left out.
      const body: Record<string, string | number> = {};
      for (const a of attributes) {
        const value = values[a.key]?.trim() ?? '';
        if (value !== '') body[a.key] = a.type === 'number' ? Number(value) : value;
      }
      try {
        await change.mutateAsync({ attributes: body });
        toast(p.saved);
        router.push(next);
      } catch (raw) {
        const error = toAppError(raw);
        if (error.code === 'ATTRIBUTES_INVALID' && Array.isArray(error.details?.failures)) {
          for (const failure of error.details.failures as { key?: string }[]) {
            if (failure.key && failure.key in values) form.setError(failure.key, { type: 'server', message: p.attributeInvalid });
            else form.setError(`root.attribute_${failure.key ?? ''}`, { type: 'server', message: p.attributeInvalid });
          }
        } else applyServerError(form, error, t);
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );

  return (
    <form method="post" noValidate className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
      <h2 className="type-h3 text-ink">{p.steps.attributes}</h2>
      <ErrorSummary form={form} fieldIds={ids} messages={t} requestId={requestIdOf(change.error)} focusSignal={focus} />
      {attributes.map((a) =>
        a.type === 'choice' ? (
          <SelectField
            key={a.key}
            form={form}
            name={a.key}
            id={`attribute-${a.key}`}
            label={a.label}
            optional={!a.required}
            options={[{ value: '', label: t.form.choose }, ...(a.options ?? []).map((option) => ({ value: option, label: option }))]}
            messages={t}
          />
        ) : (
          <TextField
            key={a.key}
            form={form}
            name={a.key}
            id={`attribute-${a.key}`}
            label={a.label}
            optional={!a.required}
            messages={t}
            inputProps={a.type === 'number' ? { inputMode: 'decimal' } : { maxLength: 200 }}
          />
        ),
      )}
      <p className="type-small text-muted-foreground">{p.attributesHelp}</p>
      <div className="flex justify-end">
        <Button type="submit" loading={change.isPending}>
          {p.saveContinue}
        </Button>
      </div>
    </form>
  );
}
