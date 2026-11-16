'use client';

import { ErrorMessage } from '@/components/common/error-message';
import { useToast } from '@/components/common/toast';
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
import { Button } from '@/components/ui/button';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { formatPhone } from '@/utils/format';
import { useRemoveVendorAddress } from '@/features/vendor/hooks/use-vendor';
import type { VendorAddress } from '@/features/vendor/types';

/**
 * One vendor address: its type, the address on one line and the phone, with Edit and Remove (which
 * asks first). On the application and the business profile; without `onEdit` it is only read, as
 * for a vendor whose application cannot be changed now (Document 5, sections 4 and 7.5).
 */
export function VendorAddressCard({
  address,
  onEdit,
}: {
  address: VendorAddress;
  onEdit?: () => void;
}) {
  const messages = useMessages();
  const toast = useToast();
  const removeVendorAddress = useRemoveVendorAddress();
  const oneLine = [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');
  const removeError = removeVendorAddress.error;

  function removeAddress() {
    removeVendorAddress.mutate(address.id, {
      onSuccess: () => toast(messages.vendor.address.removed),
    });
  }

  return (
    <div className="grid gap-3 rounded-1 border border-line p-4">
      <div className="grid gap-1">
        <p className="type-label text-ink">{messages.vendor.address.types[address.type]}</p>
        <p className="text-ink">{oneLine}</p>
        <p className="type-small text-ink-2 tabular-nums">{formatPhone(address.contactPhone)}</p>
      </div>
      {removeError ? (
        <ErrorMessage
          text={messageFor(removeError, messages)}
          requestId={removeError.requestId}
          messages={messages}
        />
      ) : null}
      {onEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="small" onClick={onEdit}>
            {messages.vendor.address.edit}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                size="small"
                disabled={removeVendorAddress.isPending}
              >
                {messages.vendor.address.remove}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{messages.vendor.address.removeTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {fill(messages.vendor.address.removeBody, { address: oneLine })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="destructiveConfirm" onClick={removeAddress}>
                  {messages.vendor.address.remove}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </div>
  );
}
