'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductsPath } from '@/lib/routes';
import { useBasicsForm } from '@/features/product/hooks/use-basics-form';
import type { Dictionaries, ProductView } from '@/features/product/types';
import { BasicsFields } from './basics-fields';

/**
 * Step 1, basics (Document 5, section 7.3): title, category, brand and description. The tax comes
 * from the category by default; a vendor may declare their own HSN code and GST rate as a pair,
 * which a moderator then confirms (area-3b-products.md, "Tax"). It only draws; what happens on save
 * is in `use-basics-form.ts`.
 */
const FIELD_IDS = {
  title: 'product-title',
  categoryId: 'product-category',
  brandId: 'product-brand',
  description: 'product-description',
  hsnCode: 'product-hsn',
  gstRateBps: 'product-gst',
} as const;

export function BasicsStep({
  lang,
  product,
  dictionaries,
}: {
  lang: Locale;
  product: ProductView | null;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const basicsForm = useBasicsForm({ lang, product, dictionaries });
  const { form } = basicsForm;

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(basicsForm.saveBasics, basicsForm.showValidationErrors)}
    >
      <h2 className="type-h3 text-ink">{productMessages.steps.basics}</h2>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={basicsForm.requestId}
        focusSignal={basicsForm.focusSignal}
      />
      <BasicsFields
        form={form}
        fieldIds={FIELD_IDS}
        categoryChoices={basicsForm.categoryChoices}
        chosenCategory={basicsForm.chosenCategory}
        dictionaries={dictionaries}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {product ? (
          <Button asChild variant="quiet">
            <Link href={myProductsPath(lang)}>{productMessages.backToList}</Link>
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" loading={basicsForm.isSaving}>
          {productMessages.saveContinue}
        </Button>
      </div>
    </Form>
  );
}
