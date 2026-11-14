'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import type { Messages } from '@/lib/i18n';
import { useUnavailableLines } from '@/features/cart/hooks/use-unavailable-lines';

/**
 * Shown when some lines can no longer be bought: a warning with "Remove unavailable items", which
 * asks first. It only draws; the removal is in `use-unavailable-lines.ts`.
 */
export function UnavailableBanner({
  couponCode,
  messages,
}: {
  couponCode: string;
  messages: Messages;
}) {
  const cartMessages = messages.cart;
  const unavailableLines = useUnavailableLines(couponCode);
  return (
    <>
      <Banner
        tone="warning"
        action={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={unavailableLines.isRemoving}
              >
                {cartMessages.removeUnavailable}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{cartMessages.removeUnavailableTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {cartMessages.removeUnavailableBody}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructiveConfirm"
                  onClick={unavailableLines.removeAll}
                >
                  {cartMessages.remove}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      >
        {cartMessages.someUnavailable}
      </Banner>
      {unavailableLines.errorText ? (
        <ErrorMessage
          text={unavailableLines.errorText}
          requestId={unavailableLines.errorRequestId}
          messages={messages}
        />
      ) : null}
    </>
  );
}
