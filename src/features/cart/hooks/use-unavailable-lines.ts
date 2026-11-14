'use client';

import { messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { useRemoveUnavailable } from './use-cart';

/**
 * "Remove unavailable items" (Document 5, section 6.3): after the person confirms, the backend
 * removes every line that can no longer be bought, in one call. The screen,
 * `unavailable-banner.tsx`, only draws.
 */
export function useUnavailableLines(couponCode: string) {
  const messages = useMessages();
  const removeUnavailable = useRemoveUnavailable(couponCode);
  const error = removeUnavailable.error;

  function removeAll() {
    removeUnavailable.mutate();
  }

  return {
    removeAll,
    isRemoving: removeUnavailable.isPending,
    errorText: error ? messageFor(error, messages) : null,
    errorRequestId: error?.requestId,
  };
}
