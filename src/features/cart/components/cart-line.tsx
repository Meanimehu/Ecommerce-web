'use client';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ErrorMessage } from '@/components/common/error-message';
import { PhotoFrame } from '@/components/common/photo-frame';
import { StatusChip } from '@/components/common/status-chip';
import { fill } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { productPath } from '@/lib/routes';
import { formatRupees } from '@/utils/format';
import { useCartLine } from '@/features/cart/hooks/use-cart-line';
import { LineStatus } from '@/features/cart/rules';
import type { CartLine } from '@/features/cart/types';

/**
 * One cart line: photo, title, size and colour, price, what the backend says about it, the quantity
 * and "Remove". It only draws; the changes are in `use-cart-line.ts`.
 */
export function CartLineItem({
  lang,
  line,
  couponCode,
  messages,
}: {
  lang: Locale;
  line: CartLine;
  couponCode: string;
  messages: Messages;
}) {
  const cartMessages = messages.cart;
  const cartLine = useCartLine({ line, couponCode });
  const quantityId = `quantity-${line.variantId}`;
  const variantText = [
    line.sizeCode ? fill(cartMessages.size, { size: line.sizeCode }) : null,
    line.colourCode ? fill(cartMessages.colour, { colour: line.colourCode }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-4 first:pt-0">
      <PhotoFrame
        src={line.image}
        alt=""
        unavailable={messages.common.photoUnavailable}
        dimmed={cartLine.hasProblem}
      />
      <div className="grid gap-2">
        <div className="flex flex-wrap justify-between gap-2">
          <a
            href={productPath(lang, line.productId, line.title)}
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            {line.title}
          </a>
          <span className="font-medium tabular-nums text-ink">
            {formatRupees(line.lineTotalPaise)}
          </span>
        </div>
        <p className="type-small text-ink-2">{variantText}</p>
        <p className="type-small tabular-nums text-ink">
          {formatRupees(line.unitPricePaise)} {cartMessages.each}
          {line.strikeThroughPaise ? (
            <span className="ms-2 text-muted-foreground line-through">
              {formatRupees(line.strikeThroughPaise)}
            </span>
          ) : null}
        </p>
        {cartLine.isNoted ? (
          <div className="grid gap-1">
            <div>
              <StatusChip
                tone={line.status === LineStatus.LowStock ? 'warning' : 'error'}
                label={cartLine.statusLabel}
              />
            </div>
            <p className="type-small text-ink">{cartLine.explanation}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          {cartLine.canChangeQuantity ? (
            <div className="grid gap-1">
              <label htmlFor={quantityId} className="type-small text-ink-2">
                {cartMessages.quantity}
              </label>
              <Select
                id={quantityId}
                value={String(line.quantity)}
                disabled={cartLine.isChanging}
                className="w-24 lg:h-10"
                onChange={(event) => cartLine.chooseQuantity(event.target.value)}
              >
                {cartLine.quantityChoices.map((quantity) => (
                  <option key={quantity} value={quantity}>
                    {quantity}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <Button
            type="button"
            variant="quiet"
            size="small"
            disabled={cartLine.isRemoving}
            onClick={cartLine.removeThisLine}
          >
            {cartMessages.remove}
            <span className="sr-only">: {line.title}</span>
          </Button>
        </div>
        {cartLine.errorText ? (
          <ErrorMessage
            text={cartLine.errorText}
            requestId={cartLine.errorRequestId}
            messages={messages}
          />
        ) : null}
      </div>
    </li>
  );
}
