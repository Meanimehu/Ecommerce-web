'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { cartPath } from '@/lib/routes';
import { formatDate } from '@/utils/format';
import { useProductAdd } from '@/features/storefront/product-page/hooks/use-product-add';
import { useProductNow } from '@/features/storefront/product-page/hooks/use-product-page';
import { useVariantChoice } from '@/features/storefront/product-page/hooks/use-variant-choice';
import {
  isAnyInStock,
  MissingChoice,
  StockLevel,
  stockLevelOf,
} from '@/features/storefront/product-page/rules';
import type { ProductDetail } from '@/features/storefront/product-page/types';
import { ColourChoice } from './colour-choice';
import { Price } from '@/components/common/price';
import { SizeChoice } from './size-choice';

/**
 * Choosing a variant and adding it to the cart (Document 5, section 6.2; Document 6, 8.5). The page
 * may have been kept for a while (Document 4, section 7), so the product is read again here, and
 * that answer gives the price and stock. "Add to cart" can always be pressed while anything is in
 * stock (owner, 23 Nov 2026): with a choice still to make it adds nothing, says what to choose and
 * moves focus to that choice. It is off only when nothing, or the chosen variant, is in stock. It
 * only draws; the choice is in `use-variant-choice.ts` and the
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
  const canAdd = isAnyInStock(product.variants) && (!chosen || chosen.inStock);
  const sizeArea = useRef<HTMLDivElement>(null);
  const colourArea = useRef<HTMLDivElement>(null);
  const hintId = 'add-to-cart-hint';

  // With a choice still to make, the press goes to that choice instead of the cart.
  function pressAdd() {
    if (chosen) {
      productAdd.addChosen();
      return;
    }
    const needsSize = variantChoice.missingChoice !== MissingChoice.Colour;
    const area = needsSize ? sizeArea.current : colourArea.current;
    area?.querySelector<HTMLButtonElement>('button:not([aria-disabled])')?.focus();
  }

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
        <div ref={sizeArea}>
          <SizeChoice
            sizes={variantChoice.sizes}
            sizeCode={variantChoice.sizeCode}
            isAvailable={variantChoice.isSizeAvailable}
            onChoose={variantChoice.chooseSize}
            messages={messages}
          />
        </div>
      ) : null}
      {variantChoice.colours.length ? (
        <div ref={colourArea}>
          <ColourChoice
            colours={variantChoice.colours}
            colourCode={variantChoice.colourCode}
            isAvailable={variantChoice.isColourAvailable}
            onChoose={variantChoice.chooseColour}
            messages={messages}
          />
        </div>
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
          disabled={!canAdd}
          loading={productAdd.isAdding}
          aria-describedby={variantChoice.missingChoice && canAdd ? hintId : undefined}
          onClick={pressAdd}
        >
          {storeMessages.addToCart}
        </Button>
        {variantChoice.missingChoice && canAdd ? (
          <p id={hintId} className="type-small text-ink-2">
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
