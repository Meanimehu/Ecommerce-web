'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import { addAfterLogin, takeAddNotice, useAddToCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { AppErrorCode } from '@/lib/error-codes';
import { AppError, fill, messageFor, toAppError } from '@/lib/errors';
import { get } from '@/lib/http';
import { HttpStatus } from '@/lib/http-status';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { AddOutcome, type AddNotice } from '@/types/add-notice';
import type { ProductDetail, PublicVariant } from '@/types/catalogue';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { Price } from './price';

/**
 * Choosing a variant and adding it to the cart (Document 5, section 6.2; Document 6, 8.5). The page may have been kept
 * for a while (Document 4, section 7), so the product is read again here and that answer gives the price and stock.
 * A size or colour with no variant in stock is crossed out and says "Unavailable" in text, never by colour alone. The
 * button stays off until one variant is chosen, with a message saying what to choose. Not logged in: the person logs
 * in and the add runs once on the way back (D2-02).
 */
export function ProductBuy({ lang, product: initial }: { lang: Locale; product: ProductDetail }) {
  const t = useMessages();
  const s = t.store;
  const product = useQuery({
    queryKey: ['storefront', 'product', initial.id],
    queryFn: () => get<ProductDetail>(`/api/catalogue/products/${encodeURIComponent(initial.id)}`),
    initialData: initial,
    staleTime: 0,
    refetchOnMount: 'always',
  }).data;
  const session = useSession();
  const add = useAddToCart();
  const variants = product.variants;
  const sizes = unique(variants.map((v) => v.size).filter((x): x is NonNullable<PublicVariant['size']> => x !== null));
  const colours = unique(variants.map((v) => v.colour).filter((x): x is NonNullable<PublicVariant['colour']> => x !== null));
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? (sizes[0]?.code ?? null) : null);
  const [colour, setColour] = useState<string | null>(colours.length === 1 ? (colours[0]?.code ?? null) : null);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [leaving, setLeaving] = useState(false);

  // What the login answer said about an add made before logging in (D2-02), shown once.
  useEffect(() => {
    const notice = takeAddNotice();
    if (notice) showNotice(notice, t, setMessage, setError);
  }, [t]);

  const chosen = variants.find((v) => (v.size?.code ?? null) === (sizes.length ? size : null) && (v.colour?.code ?? null) === (colours.length ? colour : null)) ?? null;
  const available = (sizeCode: string | null, colourCode: string | null) =>
    variants.some((v) => v.inStock && (sizeCode === null || v.size?.code === sizeCode) && (colourCode === null || v.colour?.code === colourCode));
  const shown = chosen ?? product;
  const need = !chosen ? (sizes.length && !size ? (colours.length && !colour ? s.chooseBoth : s.chooseSize) : s.chooseColour) : null;

  const onAdd = async () => {
    if (!chosen) return;
    setMessage(null);
    setError(null);
    if (!session.data?.user) {
      setLeaving(true);
      try {
        await addAfterLogin({ variantId: chosen.id, quantity: 1, lang });
      } catch (raw) {
        setLeaving(false);
        setError(toAppError(raw));
      }
      return;
    }
    add.mutate(
      { variantId: chosen.id, quantity: 1 },
      {
        onSuccess: () => setMessage({ tone: 'success', text: s.addedToCart }),
        onError: (raw) => {
          const failure = toAppError(raw);
          if (failure.code === 'UNAUTHORIZED') {
            setLeaving(true);
            void addAfterLogin({ variantId: chosen.id, quantity: 1, lang });
          } else if (failure.outcomeUnknown) setMessage({ tone: 'warning', text: s.addUnknown });
          else setError(failure);
        },
      },
    );
  };

  return (
    <div className="grid content-start gap-5">
      <Price pricePaise={shown.pricePaise} mrpPaise={shown.mrpPaise} discountPercent={shown.discountPercent} t={t} size="page" />
      <p className="-mt-3 type-small text-ink-2">{s.taxesIncluded}</p>
      {shown.onSale && shown.saleEndsAt ? <p className="type-small text-ink">{fill(s.saleEnds, { date: formatDate(shown.saleEndsAt, lang) })}</p> : null}

      {sizes.length ? (
        <fieldset className="grid gap-2">
          <legend className="type-label text-ink">
            {s.size}
            {size ? `: ${sizes.find((x) => x.code === size)?.label}` : ''}
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((option) => {
              const ok = available(option.code, colour);
              return (
                <button
                  key={option.code}
                  type="button"
                  aria-pressed={size === option.code}
                  aria-disabled={!ok || undefined}
                  aria-label={ok ? option.label : `${option.label}, ${s.unavailable}`}
                  onClick={() => ok && setSize(option.code)}
                  className={cn(
                    'min-h-12 min-w-12 rounded-2 border px-3 font-medium transition-colors duration-100',
                    size === option.code ? 'border-ink bg-ink text-surface' : 'border-control bg-surface text-ink hover:border-ink',
                    !ok && 'cursor-not-allowed border-dotted text-muted-foreground line-through hover:border-control',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {colours.length ? (
        <fieldset className="grid gap-2">
          <legend className="type-label text-ink">
            {s.colour}
            {colour ? `: ${colours.find((x) => x.code === colour)?.label}` : ''}
          </legend>
          <div className="flex flex-wrap gap-2">
            {colours.map((option) => {
              const ok = available(size, option.code);
              return (
                <button
                  key={option.code}
                  type="button"
                  aria-pressed={colour === option.code}
                  aria-disabled={!ok || undefined}
                  aria-label={ok ? option.label : `${option.label}, ${s.unavailable}`}
                  title={option.label}
                  onClick={() => ok && setColour(option.code)}
                  className={cn('relative flex size-12 items-center justify-center rounded-full border-2', colour === option.code ? 'border-ink' : 'border-transparent', !ok && 'cursor-not-allowed')}
                >
                  <span aria-hidden="true" className="size-10 rounded-full border border-control" style={option.hex ? { background: option.hex } : undefined} />
                  {!ok ? <span aria-hidden="true" className="absolute h-0.5 w-12 rotate-45 bg-ink" /> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {sizes.length || colours.length ? <p className="type-small text-muted-foreground">{s.unavailableHelp}</p> : null}

      <p className="type-small font-medium text-ink">{stockText(chosen, product, t)}</p>

      <div className="grid gap-2">
        <Button type="button" size="large" className="w-full sm:w-auto sm:justify-self-start" disabled={!chosen || !chosen.inStock || add.isPending || leaving} loading={add.isPending || leaving} onClick={() => void onAdd()}>
          {t.store.addToCart}
        </Button>
        {need ? <p className="type-small text-ink-2">{need}</p> : null}
      </div>
      {/* Always present, so a new message is announced (Document 6, section 11). */}
      <div role="status">
        {message ? (
          <Banner tone={message.tone} action={<Link href={`/${lang}/cart`}>{s.viewCart}</Link>}>
            {message.text}
          </Banner>
        ) : null}
      </div>
      {error ? <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} t={t} /> : null}
    </div>
  );
}

function stockText(chosen: PublicVariant | null, product: ProductDetail, t: Messages): string {
  const item = chosen ?? product;
  if (!item.inStock) return t.store.outOfStock;
  return item.lowStock ? t.store.lowStock : t.store.inStock;
}

function unique<T extends { code: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.code, item])).values()];
}

function showNotice(notice: AddNotice, t: Messages, setMessage: (m: { tone: 'success' | 'warning'; text: string }) => void, setError: (e: AppError) => void) {
  if (notice.outcome === AddOutcome.Added) setMessage({ tone: 'success', text: t.store.addedToCart });
  else if (notice.outcome === AddOutcome.Unknown) setMessage({ tone: 'warning', text: t.store.addUnknown });
  else setError(new AppError({ code: notice.code ?? AppErrorCode.UnknownError, status: HttpStatus.Conflict }));
}
