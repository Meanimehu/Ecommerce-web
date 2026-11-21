'use client';

import { useState } from 'react';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import type { AppError } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { ReasonSchema, type ReasonInput } from '@/types/common';

/**
 * What the feature does with a confirmed reason: it calls its decision's `mutate` with these two
 * named functions (Document 7, 20.9). The dialog closes on success and shows the refusal on error.
 */
export interface ReasonOutcome {
  onSuccess: () => void;
  onError: (error: AppError) => void;
}

export type ConfirmWithReason = (reason: string, outcome: ReasonOutcome) => void;

/**
 * A reason dialog (Document 6, 8.10): the reason checked before sending, then handed to the
 * feature's decision. It stays open with the backend's refusal in its summary, the reason kept and
 * focus on the summary, and closes once the decision is made. The screen, `reason-dialog-form.tsx`,
 * only draws; it is new each time the dialog opens, so each opening starts with an empty reason.
 */
export function useReasonDialog({
  onConfirm,
  messages,
  onClose,
}: {
  onConfirm: ConfirmWithReason;
  messages: Messages;
  /** Closes the dialog once the decision is made. */
  onClose: () => void;
}) {
  const [isSending, setIsSending] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const form = useAppForm<ReasonInput, { reason: string }>(ReasonSchema, { reason: '' });

  function moveFocusToSummary() {
    setFocusSignal((signal) => signal + 1);
  }

  function closeDialog() {
    setIsSending(false);
    onClose();
  }

  function showRefusal(error: AppError) {
    setIsSending(false);
    applyServerError(form, error, messages);
    moveFocusToSummary();
  }

  function sendReason(values: { reason: string }) {
    setIsSending(true);
    onConfirm(values.reason, { onSuccess: closeDialog, onError: showRefusal });
  }

  return {
    form,
    submit: form.handleSubmit(sendReason, moveFocusToSummary),
    isSending,
    focusSignal,
  };
}
