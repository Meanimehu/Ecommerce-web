import { PhotoFrame } from '@/components/common/photo-frame';
import type { Locale, Messages } from '@/lib/i18n';
import { productPath } from '@/lib/routes';
import type { ProductCardData } from '@/features/storefront/types';
import { Price } from './price';

/**
 * The product card (Document 6, 8.6): the complete photo in a 4:5 frame, the title (two lines at
 * most), the vendor, the price line, the ochre "Sale" tag when the backend says a sale runs, and
 * the "Out of stock" plate. The whole card is one link. No hover effect (D6-56). The photo is loaded
 * from the public photo host (D3-04).
 */
export function ProductCard({
  product,
  lang,
  messages,
  isEager = false,
}: {
  product: ProductCardData;
  lang: Locale;
  messages: Messages;
  isEager?: boolean;
}) {
  const storeMessages = messages.store;
  return (
    <a
      href={productPath(lang, product.id, product.title)}
      className="group grid content-start gap-2 rounded-1 text-ink no-underline"
    >
      <div className="relative">
        <PhotoFrame
          src={product.coverUrl}
          alt=""
          unavailable={messages.common.photoUnavailable}
          eager={isEager}
          dimmed={!product.inStock}
        />
        {product.onSale ? (
          <span className="absolute start-2 top-2 rounded-1 bg-sale px-2 py-0.5 type-caption font-medium text-ink">
            {storeMessages.sale}
          </span>
        ) : null}
        {!product.inStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-surface py-1.5 text-center type-small font-medium text-ink">
            {storeMessages.outOfStock}
          </span>
        ) : null}
      </div>
      <span className="line-clamp-2 type-small font-medium">{product.title}</span>
      <span className="truncate type-small text-muted-foreground">
        {product.vendor.displayName}
      </span>
      <Price
        pricePaise={product.pricePaise}
        mrpPaise={product.mrpPaise}
        discountPercent={product.discountPercent}
        messages={messages}
      />
    </a>
  );
}
