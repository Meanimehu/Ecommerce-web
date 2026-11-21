'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { ProductDecision, ReviewKind, type ModerationView } from '@/features/product/types';
import { useDecideProduct } from './use-product';

/**
 * A moderator's decision on one product (Document 5, section 8.3). Both send the time the screen
 * was loaded (seenUpdatedAt): if the vendor changed the product meanwhile, the backend refuses
 * with REVIEW_STALE. The same two decisions work for a new listing and for a revision of an
 * approved product. Approving a vendor-declared tax needs the moderator to confirm it. Rejecting
 * needs a reason and is made in a reason dialog, which shows its own error: it hands this hook the
 * reason with what to do on success and on error (20.9); approving shows its error here. The screen, `moderation-review.tsx`, only draws.
 */
export function useProductDecision(view: ModerationView) {
  const messages = useMessages();
  const toast = useToast();
  const decideProduct = useDecideProduct(view.product.id);
  const [isTaxConfirmed, setIsTaxConfirmed] = useState(false);
  const [decisionError, setDecisionError] = useState<AppError | null>(null);
  // A revision's decision has its own words: the changes, not the product, are approved or rejected.
  const decidedMessages =
    view.awaiting === ReviewKind.Revision ? messages.moderation.revision : messages.moderation;

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

  function rejectProduct(reason: string, outcome: ReasonOutcome) {
    decideProduct.mutate(
      { decision: ProductDecision.Reject, body: { seenUpdatedAt: view.seenUpdatedAt, reason } },
      { onSuccess: () => showRejected(outcome), onError: outcome.onError },
    );
  }

  function showApproved() {
    toast(decidedMessages.approved);
  }

  function showRejected(outcome: ReasonOutcome) {
    setDecisionError(null);
    toast(decidedMessages.rejected);
    outcome.onSuccess();
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
