'use client';

import { useState } from 'react';
import { useToast } from '@/components/common/toast';
import type { AppError } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { useConfirmImport } from './use-imports';

/**
 * Confirming an import (Document 5, sections 7.3 and 11): one press creates each ready product as a
 * draft, product by product. After any answer the import is read again, so the screen shows each
 * product's result only from what the backend holds. When the answer is lost, the screen says so
 * and shows the import as read again; it never confirms again by itself (a second confirm cannot
 * create anything twice, V5-3). The screen, `import-view.tsx`, only draws.
 */
export function useImportConfirm(id: string) {
  const messages = useMessages();
  const toast = useToast();
  const confirmImport = useConfirmImport(id);
  const [confirmError, setConfirmError] = useState<AppError | null>(null);
  const [isOutcomeUnknown, setIsOutcomeUnknown] = useState(false);
  const [answerSignal, setAnswerSignal] = useState(0);

  function confirm() {
    setConfirmError(null);
    setIsOutcomeUnknown(false);
    confirmImport.mutate(undefined, {
      onSuccess: showConfirmed,
      onError: showConfirmError,
      onSettled: moveToAnswer,
    });
  }

  function showConfirmed() {
    toast(messages.imports.view.confirmedToast);
  }

  function showConfirmError(error: AppError) {
    if (error.outcomeUnknown) setIsOutcomeUnknown(true);
    else setConfirmError(error);
  }

  function moveToAnswer() {
    setAnswerSignal((signal) => signal + 1);
  }

  return {
    confirm,
    isConfirming: confirmImport.isPending,
    confirmError,
    isOutcomeUnknown,
    answerSignal,
  };
}
