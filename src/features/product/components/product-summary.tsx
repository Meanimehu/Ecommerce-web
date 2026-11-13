'use client';

import { PhotoFrame } from '@/components/common/photo-frame';
import { useMessages } from '@/lib/messages-context';
import { myPhotoSrc } from '@/features/product/hooks/use-product';
import {
  dictionaryLabel,
  findCategoryChoice,
  PhotoSize,
  sortedPhotos,
  VariantStatus,
  type Dictionaries,
  type ProductView,
} from '@/features/product/types';
import { formatRate, formatRupees } from '@/utils/format';

/**
 * A product the vendor cannot change right now (in review, live, or the vendor is not approved):
 * what it holds, read-only (Document 5, sections 7.3 and 7.5).
 */
export function ProductSummary({
  product,
  dictionaries,
}: {
  product: ProductView;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const productMessages = messages.product;
  const fieldMessages = productMessages.fields;
  const categoryChoice = findCategoryChoice(dictionaries.categories, product.categoryId);
  const brand = dictionaries.brands.find(
    (dictionaryBrand) => dictionaryBrand.id === product.brandId,
  );
  const rate = product.gstRateBps === null ? null : formatRate(product.gstRateBps);
  const attributeLabel = (key: string) =>
    categoryChoice?.category.attributes.find((attribute) => attribute.key === key)?.label ?? key;
  const rows: [string, string][] = [
    [fieldMessages.category, categoryChoice?.path ?? '—'],
    [fieldMessages.brand, brand?.name ?? '—'],
    [fieldMessages.description, product.description ?? '—'],
    [fieldMessages.tax, [product.hsnCode, rate].filter(Boolean).join(', ') || '—'],
    ...Object.entries(product.attributes).map(([key, value]): [string, string] => [
      attributeLabel(key),
      String(value),
    ]),
  ];

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{productMessages.steps.basics}</h2>
        <dl className="grid gap-2">
          {rows.map(([name, value]) => (
            <div key={name} className="grid gap-0.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3">
              <dt className="type-small text-ink-2">{name}</dt>
              <dd className="whitespace-pre-line text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="grid gap-3 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{productMessages.steps.variants}</h2>
        <ul className="grid divide-y divide-line">
          {product.variants.map((variant) => (
            <li key={variant.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-ink">
                {variant.sku}, {dictionaryLabel(dictionaries.sizes, variant.sizeCode)},{' '}
                {dictionaryLabel(dictionaries.colours, variant.colourCode)}
                {variant.status === VariantStatus.Inactive
                  ? ` (${productMessages.variant.inactive})`
                  : ''}
              </span>
              <span className="tabular-nums text-ink">
                {formatRupees(variant.pricePaise)}{' '}
                <span className="text-muted-foreground line-through">
                  {formatRupees(variant.mrpPaise)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{productMessages.steps.photos}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sortedPhotos(product.images).map((photo) => (
            <li key={photo.id}>
              <PhotoFrame
                src={myPhotoSrc(product.id, photo.id, PhotoSize.Thumb)}
                alt={photo.altText ?? ''}
                unavailable={messages.common.photoUnavailable}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
