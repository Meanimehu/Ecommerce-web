'use client';

import { useMessages } from '@/lib/messages-context';
import { flattenCategories, type Dictionaries, type ProductView } from '@/features/product/types';
import { formatRate, formatRupees } from '@/utils/format';
import { myPhotoSrc } from '@/features/product/hooks/use-product';
import { PhotoFrame } from '@/components/common/photo-frame';
import { sortedPhotos } from './product-photos';

/**
 * A product the vendor cannot change right now (in review, live, or the vendor is not approved): what it holds,
 * read-only (Document 5, sections 7.3 and 7.5).
 */
export function ProductSummary({ product, dictionaries }: { product: ProductView; dictionaries: Dictionaries }) {
  const t = useMessages();
  const p = t.product;
  const category = flattenCategories(dictionaries.categories).find((c) => c.category.id === product.categoryId);
  const brand = dictionaries.brands.find((b) => b.id === product.brandId);
  const label = (list: readonly { code: string; label: string }[], code: string | null) => (code ? (list.find((i) => i.code === code)?.label ?? code) : '—');
  const rows: [string, string][] = [
    [p.fields.category, category?.path ?? '—'],
    [p.fields.brand, brand?.name ?? '—'],
    [p.fields.description, product.description ?? '—'],
    [p.fields.tax, [product.hsnCode, product.gstRateBps === null ? null : formatRate(product.gstRateBps)].filter(Boolean).join(', ') || '—'],
    ...Object.entries(product.attributes).map(([key, value]): [string, string] => [category?.category.attributes.find((a) => a.key === key)?.label ?? key, String(value)]),
  ];
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{p.steps.basics}</h2>
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
        <h2 className="type-h3 text-ink">{p.steps.variants}</h2>
        <ul className="grid divide-y divide-line">
          {product.variants.map((v) => (
            <li key={v.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-ink">
                {v.sku}, {label(dictionaries.sizes, v.sizeCode)}, {label(dictionaries.colours, v.colourCode)}
                {v.status === 'inactive' ? ` (${p.variant.inactive})` : ''}
              </span>
              <span className="tabular-nums text-ink">
                {formatRupees(v.pricePaise)} <span className="text-muted-foreground line-through">{formatRupees(v.mrpPaise)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3 rounded-1 border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-h3 text-ink">{p.steps.photos}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {sortedPhotos(product.images).map((photo) => (
            <li key={photo.id}>
              <PhotoFrame src={myPhotoSrc(product.id, photo.id, 'thumb')} alt={photo.altText ?? ''} unavailable={t.common.photoUnavailable} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
