'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { ProductDecision, type ModerationView } from '@/features/product/types';
import { useDecideProduct } from './use-product';

/**
 * A moderator's decision on one product (Document 5, section 8.3). Both send the time the screen
 * was loaded (seenUpdatedAt): if the vendor changed the product meanwhile, the backend refuses
 * with REVIEW_STALE. Approving a vendor-declared tax needs the moderator to confirm it. Rejecting
 * needs a reason and is made in a reason dialog, which shows its own error, so it returns the
 * call's promise; approving shows its error here. The screen, `moderation-review.tsx`, only draws.
 */
export function useProductDecision(view: ModerationView) {
  const messages = useMessages();
  const toast = useToast();
  const decideProduct = useDecideProduct(view.product.id);
  const [isTaxConfirmed, setIsTaxConfirmed] = useState(false);
  const [decisionError, setDecisionError] = useState<AppError | null>(null);

  function approveProduct() {
    setDecisionError(null);
    const taxConfirmation = view.taxConfirmationRequired ? { confirmTax: isTaxConfirmed } : {};
    decideProduct.mutate(
      {
        decision: ProductDecision.Approve,
        body: { seenUpdatedAt: view.seenUpdatedAt, ...taxConfirmation },
      },
      { onSuccess: showApproved, onError: setDecisionError },
    );
  }

  const rejectProduct = (reason: string) =>
    decideProduct
      .mutateAsync({
        decision: ProductDecision.Reject,
        body: { seenUpdatedAt: view.seenUpdatedAt, reason },
      })
      .then(showRejected);

  function showApproved() {
    toast(messages.moderation.approved);
  }

  function showRejected() {
    setDecisionError(null);
    toast(messages.moderation.rejected);
  }

  const isApproving =
    decideProduct.isPending && decideProduct.variables?.decision === ProductDecision.Approve;

  return {
    isTaxConfirmed,
    setIsTaxConfirmed,
    canApprove: !view.taxConfirmationRequired || isTaxConfirmed,
    approveProduct,
    rejectProduct,
    isDeciding: decideProduct.isPending,
    isApproving,
    decisionError,
  };
}
