'use client';

import Link from 'next/link';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { cartPath } from '@/lib/routes';
import { formatDate } from '@/utils/format';
import { useProductAdd } from '@/features/storefront/hooks/use-product-add';
import { useProductNow } from '@/features/storefront/hooks/use-storefront';
import { useVariantChoice } from '@/features/storefront/hooks/use-variant-choice';
import {
  MissingChoice,
  StockLevel,
  stockLevelOf,
  type ProductDetail,
} from '@/features/storefront/types';
import { ColourChoice } from './colour-choice';
import { Price } from './price';
import { SizeChoice } from './size-choice';

/**
 * Choosing a variant and adding it to the cart (Document 5, section 6.2; Document 6, 8.5). The page
 * may have been kept for a while (Document 4, section 7), so the product is read again here, and
 * that answer gives the price and stock. The button stays off until one variant is chosen, with a
 * message saying what to choose. It only draws; the choice is in `use-variant-choice.ts` and the
 * add in `use-product-add.ts`.
 */
export function ProductBuy({
  lang,
  product: productAsDrawn,
}: {
  lang: Locale;
  product: ProductDetail;
}) {
  const messages = useMessages();
  const storeMessages = messages.store;
  const product = useProductNow(productAsDrawn).data;
  const variantChoice = useVariantChoice(product.variants);
  const { chosen } = variantChoice;
  const productAdd = useProductAdd({ lang, chosen });
  const shown = chosen ?? product;
  const hasChoices = variantChoice.sizes.length > 0 || variantChoice.colours.length > 0;

  return (
    <div className="grid content-start gap-5">
      <Price
        pricePaise={shown.pricePaise}
        mrpPaise={shown.mrpPaise}
        discountPercent={shown.discountPercent}
        messages={messages}
        size="page"
      />
      <p className="-mt-3 type-small text-ink-2">{storeMessages.taxesIncluded}</p>
      {shown.onSale && shown.saleEndsAt ? (
        <p className="type-small text-ink">
          {fill(storeMessages.saleEnds, { date: formatDate(shown.saleEndsAt, lang) })}
        </p>
      ) : null}

      {variantChoice.sizes.length ? (
        <SizeChoice
          sizes={variantChoice.sizes}
          sizeCode={variantChoice.sizeCode}
          isAvailable={variantChoice.isSizeAvailable}
          onChoose={variantChoice.chooseSize}
          messages={messages}
        />
      ) : null}
      {variantChoice.colours.length ? (
        <ColourChoice
          colours={variantChoice.colours}
          colourCode={variantChoice.colourCode}
          isAvailable={variantChoice.isColourAvailable}
          onChoose={variantChoice.chooseColour}
          messages={messages}
        />
      ) : null}
      {hasChoices ? (
        <p className="type-small text-muted-foreground">{storeMessages.unavailableHelp}</p>
      ) : null}

      <p className="type-small font-medium text-ink">{stockText(shown, messages)}</p>

      <div className="grid gap-2">
        <Button
          type="button"
          size="large"
          className="w-full sm:w-auto sm:justify-self-start"
          disabled={!chosen || !chosen.inStock || productAdd.isAdding}
          loading={productAdd.isAdding}
          onClick={productAdd.addChosen}
        >
          {storeMessages.addToCart}
        </Button>
        {variantChoice.missingChoice ? (
          <p className="type-small text-ink-2">
            {missingChoiceText(variantChoice.missingChoice, messages)}
          </p>
        ) : null}
      </div>
      {/* Always present, so a new message is announced (Document 6, section 11). */}
      <div role="status">
        {productAdd.message ? (
          <Banner
            tone={productAdd.message.tone}
            action={<Link href={cartPath(lang)}>{storeMessages.viewCart}</Link>}
          >
            {productAdd.message.text}
          </Banner>
        ) : null}
      </div>
      {productAdd.addError ? (
        <ErrorMessage
          text={messageFor(productAdd.addError, messages)}
          requestId={productAdd.addError.requestId}
          messages={messages}
        />
      ) : null}
    </div>
  );
}

function stockText(item: { inStock: boolean; lowStock: boolean }, messages: Messages): string {
  const stockLevel = stockLevelOf(item);
  if (stockLevel === StockLevel.Out) return messages.store.outOfStock;
  if (stockLevel === StockLevel.Low) return messages.store.lowStock;
  return messages.store.inStock;
}

function missingChoiceText(missingChoice: MissingChoice, messages: Messages): string {
  if (missingChoice === MissingChoice.SizeAndColour) return messages.store.chooseBoth;
  if (missingChoice === MissingChoice.Size) return messages.store.chooseSize;
  return messages.store.chooseColour;
}
