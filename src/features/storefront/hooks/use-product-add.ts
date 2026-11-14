'use client';

import { useEffect, useState } from 'react';
import { addAfterLogin, takeAddNotice, useAddToCart } from '@/hooks/use-cart';
import { AppErrorCode, BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { HttpStatus } from '@/lib/http-status';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { AddOutcome, type AddNotice } from '@/types/add-notice';
import { useSession } from '@/features/auth/hooks/use-auth';
import { AddMessageTone, type AddMessage } from '@/features/storefront/rules';
import type { PublicVariant } from '@/features/storefront/types';

/** An "Add to cart" is always one item; the quantity changes in the cart. */
const QUANTITY_ADDED = 1;

/**
 * "Add to cart" on the product page (Document 5, section 6.2; D2-02). Logged in, the variant is
 * added here and a message says so. Not logged in, or when the session has ended, the person goes
 * to log in and the add runs once on the way back; the login answer's word on it is shown when the
 * person returns. The screen, `product-buy.tsx`, only draws.
 *
 * Going to log in uses the cart's `addAfterLogin`, a plain function until the cart is cleaned up in
 * step 9 (Document 7, 20.13), with a named function for its failure.
 */
export function useProductAdd({ lang, chosen }: { lang: Locale; chosen: PublicVariant | null }) {
  const messages = useMessages();
  const session = useSession();
  const addToCart = useAddToCart();
  const [message, setMessage] = useState<AddMessage | null>(null);
  const [addError, setAddError] = useState<AppError | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // What the login answer said about an add made before logging in, shown once.
  useEffect(() => {
    const notice = takeAddNotice();
    if (notice) showNotice(notice, messages, setMessage, setAddError);
  }, [messages]);

  function addChosen() {
    if (!chosen) return;
    setMessage(null);
    setAddError(null);
    if (!session.data?.user) {
      logInAndAdd(chosen);
      return;
    }
    addToCart.mutate(
      { variantId: chosen.id, quantity: QUANTITY_ADDED },
      { onSuccess: showAdded, onError: (error) => showAddFailed(chosen, error) },
    );
  }

  function logInAndAdd(variant: PublicVariant) {
    setIsLeaving(true);
    addAfterLogin({ variantId: variant.id, quantity: QUANTITY_ADDED, lang }).then(
      undefined,
      showLeaveFailed,
    );
  }

  function showAdded() {
    setMessage({ tone: AddMessageTone.Success, text: messages.store.addedToCart });
  }

  function showAddFailed(variant: PublicVariant, error: AppError) {
    // The session ended meanwhile: log in, then the add runs on the way back.
    if (error.code === BackendErrorCode.Unauthorized) {
      setIsLeaving(true);
      void addAfterLogin({ variantId: variant.id, quantity: QUANTITY_ADDED, lang });
    } else if (error.outcomeUnknown) {
      setMessage({ tone: AddMessageTone.Warning, text: messages.store.addUnknown });
    } else {
      setAddError(error);
    }
  }

  function showLeaveFailed(error: AppError) {
    setIsLeaving(false);
    setAddError(error);
  }

  return {
    addChosen,
    isAdding: addToCart.isPending || isLeaving,
    message,
    addError,
  };
}

function showNotice(
  notice: AddNotice,
  messages: Messages,
  setMessage: (message: AddMessage) => void,
  setAddError: (error: AppError) => void,
) {
  if (notice.outcome === AddOutcome.Added) {
    setMessage({ tone: AddMessageTone.Success, text: messages.store.addedToCart });
  } else if (notice.outcome === AddOutcome.Unknown) {
    setMessage({ tone: AddMessageTone.Warning, text: messages.store.addUnknown });
  } else {
    setAddError(
      new AppError({ code: notice.code ?? AppErrorCode.UnknownError, status: HttpStatus.Conflict }),
    );
  }
}
