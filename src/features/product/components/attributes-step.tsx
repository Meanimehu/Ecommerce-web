'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import {
  findCategoryChoice,
  ProductStep,
  type Dictionaries,
  type ProductView,
} from '@/features/product/types';
import { AttributesForm } from './attributes-form';

/**
 * Step 2, attributes (Document 5, section 7.3): the fields come from the category the backend
 * sends, its parents' attributes included. A category with none, or one that is no longer offered,
 * says so and lets the vendor go on.
 */
export function AttributesStep({
  lang,
  product,
  dictionaries,
}: {
  lang: Locale;
  product: ProductView;
  dictionaries: Dictionaries;
}) {
  const productMessages = useMessages().product;
  const category = findCategoryChoice(dictionaries.categories, product.categoryId)?.category;
  const attributes = category?.attributes ?? [];
  const nextStepPath = `/${lang}/vendor/products/${product.id}?step=${ProductStep.Variants}`;

  if (attributes.length > 0) {
    return <AttributesForm product={product} attributes={attributes} nextStepPath={nextStepPath} />;
  }
  return (
    <section className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 className="type-h3 text-ink">{productMessages.steps.attributes}</h2>
      <p className="text-ink-2">
        {category ? productMessages.noAttributes : productMessages.categoryInactive}
      </p>
      <div className="flex justify-end">
        <Button asChild>
          <Link href={nextStepPath} className="no-underline">
            {productMessages.continue}
          </Link>
        </Button>
      </div>
    </section>
  );
}
