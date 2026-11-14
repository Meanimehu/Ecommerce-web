'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import { BackendErrorCode } from '@/lib/error-codes';
import type { ReasonOutcome } from '@/hooks/use-reason-dialog';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { DocumentDecision, VendorDecision } from '@/features/vendor/types';
import { useDecideVendor, useReviewVendorDocument } from './use-vendor';

/**
 * The admin's decisions on one vendor application (Document 5, section 8.3): approve, reject,
 * suspend and unsuspend the vendor, and approve or reject each document. The backend decides
 * whether a change is allowed; when approval is refused it lists what is lacking. A decision that
 * needs a reason is made in a reason dialog, which shows its own error: it hands this hook the
 * reason with what to do on success and on error (20.9); the others show their error here. The screen, `vendor-review.tsx`, only draws.
 */
export function useVendorDecisions(vendorId: string) {
  const messages = useMessages();
  const decisionMessages = messages.adminVendors;
  const toast = useToast();
  const decideVendor = useDecideVendor(vendorId);
  const reviewVendorDocument = useReviewVendorDocument(vendorId);
  const [decisionError, setDecisionError] = useState<AppError | null>(null);

  function showDecided(successMessage: string) {
    setDecisionError(null);
    toast(successMessage);
  }

  function approveVendor() {
    decideVendor.mutate(
      { decision: VendorDecision.Approve },
      { onSuccess: () => showDecided(decisionMessages.approved), onError: setDecisionError },
    );
  }

  function unsuspendVendor() {
    decideVendor.mutate(
      { decision: VendorDecision.Unsuspend },
      { onSuccess: () => showDecided(decisionMessages.unsuspended), onError: setDecisionError },
    );
  }

  function approveDocument(documentId: string) {
    reviewVendorDocument.mutate(
      { documentId, decision: DocumentDecision.Approve },
      { onSuccess: () => showDecided(decisionMessages.docApproved), onError: setDecisionError },
    );
  }

  /** A decision made in the reason dialog: the toast, then the dialog closes. */
  function showDecidedWithReason(successMessage: string, outcome: ReasonOutcome) {
    showDecided(successMessage);
    outcome.onSuccess();
  }

  function rejectVendor(reason: string, outcome: ReasonOutcome) {
    decideVendor.mutate(
      { decision: VendorDecision.Reject, reason },
      {
        onSuccess: () => showDecidedWithReason(decisionMessages.rejected, outcome),
        onError: outcome.onError,
      },
    );
  }

  function suspendVendor(reason: string, outcome: ReasonOutcome) {
    decideVendor.mutate(
      { decision: VendorDecision.Suspend, reason },
      {
        onSuccess: () => showDecidedWithReason(decisionMessages.suspended, outcome),
        onError: outcome.onError,
      },
    );
  }

  const rejectDocument = (documentId: string) => (reason: string, outcome: ReasonOutcome) => {
    reviewVendorDocument.mutate(
      { documentId, decision: DocumentDecision.Reject, reason },
      {
        onSuccess: () => showDecidedWithReason(decisionMessages.docRejected, outcome),
        onError: outcome.onError,
      },
    );
  };

  // Approval refused because something is lacking: the backend lists what.
  const outstanding = decisionError?.details?.outstanding;
  const outstandingItems =
    decisionError?.code === BackendErrorCode.VendorDocumentsPending && Array.isArray(outstanding)
      ? (outstanding as string[])
      : null;

  return {
    approveVendor,
    rejectVendor,
    suspendVendor,
    unsuspendVendor,
    approveDocument,
    rejectDocument,
    decisionError,
    outstandingItems,
    isDeciding: decideVendor.isPending || reviewVendorDocument.isPending,
    isApprovingVendor:
      decideVendor.isPending && decideVendor.variables?.decision === VendorDecision.Approve,
    isChangingVendor: decideVendor.isPending,
  };
}
