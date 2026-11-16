'use client';

import { useToast } from '@/components/common/toast';
import { BackendErrorCode } from '@/lib/error-codes';
import { useMessages } from '@/lib/messages-context';
import { useDiscardRevision, useSubmitRevision, useWithdrawRevision } from './use-product';

/**
 * A revision's own actions (Document 5, section 7.3; area-3b-products.md, section 5): send it for
 * review, take it back while it waits, or discard it (the live product is untouched). Each says so
 * in a toast; a refusal shows on the screen, and when something is missing its list comes from the
 * backend. The screen, `revision-panel.tsx`, only draws.
 */
export function useRevisionActions(productId: string) {
  const revisionMessages = useMessages().product.revision;
  const toast = useToast();
  const submitRevision = useSubmitRevision(productId);
  const withdrawRevision = useWithdrawRevision(productId);
  const discardRevision = useDiscardRevision(productId);
  const actionError = submitRevision.error ?? withdrawRevision.error ?? discardRevision.error;
  const missing =
    actionError?.code === BackendErrorCode.ProductIncomplete
      ? missingOf(actionError.details?.missing)
      : [];

  function resetAll() {
    submitRevision.reset();
    withdrawRevision.reset();
    discardRevision.reset();
  }

  function showSubmitted() {
    toast(revisionMessages.submitted);
  }

  function showWithdrawn() {
    toast(revisionMessages.withdrawn);
  }

  function showDiscarded() {
    toast(revisionMessages.discarded);
  }

  return {
    submit: () => {
      resetAll();
      submitRevision.mutate(undefined, { onSuccess: showSubmitted });
    },
    withdraw: () => {
      resetAll();
      withdrawRevision.mutate(undefined, { onSuccess: showWithdrawn });
    },
    discard: () => {
      resetAll();
      discardRevision.mutate(undefined, { onSuccess: showDiscarded });
    },
    isBusy: submitRevision.isPending || withdrawRevision.isPending || discardRevision.isPending,
    actionError,
    missing,
  };
}

/** The backend's list of what is missing, when it sends one. */
function missingOf(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
