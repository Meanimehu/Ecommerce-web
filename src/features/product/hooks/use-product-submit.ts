'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductsPath } from '@/lib/routes';
import { useDeleteProduct, useSubmitProduct } from './use-product';

/**
 * The review step's actions (Document 5, section 7.3): sending the product for review, and
 * deleting a draft that was never submitted. The backend decides in the end; its refusal shows
 * under the checklist. The screen, `review-step.tsx`, only draws.
 */
export function useProductSubmit({ lang, productId }: { lang: Locale; productId: string }) {
  const messages = useMessages();
  const router = useRouter();
  const toast = useToast();
  const submitProduct = useSubmitProduct(productId);
  const deleteProduct = useDeleteProduct(productId);
  const [actionError, setActionError] = useState<AppError | null>(null);

  function sendForReview() {
    setActionError(null);
    submitProduct.mutate(undefined, { onSuccess: showSubmitted, onError: setActionError });
  }

  function deleteDraft() {
    deleteProduct.mutate(undefined, { onSuccess: showDeleted, onError: setActionError });
  }

  function showSubmitted() {
    toast(messages.product.review.submitted);
  }

  function showDeleted() {
    toast(messages.product.review.deleted);
    router.push(myProductsPath(lang));
  }

  return {
    sendForReview,
    isSubmitting: submitProduct.isPending,
    deleteDraft,
    isDeleting: deleteProduct.isPending,
    actionError,
  };
}
