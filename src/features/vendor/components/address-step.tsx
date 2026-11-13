'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { StateBlock } from '@/components/common/state-block';
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
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import { formatPhone } from '@/utils/format';
import { useRemoveVendorAddress } from '@/features/vendor/hooks/use-vendor';
import { ApplyStep, type Vendor, type VendorAddress } from '@/features/vendor/types';
import { AddressForm } from './address-form';

/**
 * Step 2, pickup address (Document 5, section 7.1): the addresses on the application, each with
 * Edit and Remove, and a form to add one. At least one pickup address is needed to submit (the
 * backend's `missing` list says so); a return address is optional. A vendor can hold up to 5
 * addresses; the backend says when that is reached.
 */
export function AddressStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const messages = useMessages();
  const hasAddresses = vendor.addresses.length > 0;
  // One address form at a time: a new one, or the one being changed.
  const [isAdding, setIsAdding] = useState(!hasAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditingNothing = !isAdding && editingId === null;

  function startAdding() {
    setEditingId(null);
    setIsAdding(true);
  }

  function startEditing(addressId: string) {
    setIsAdding(false);
    setEditingId(addressId);
  }

  function stopEditing() {
    setIsAdding(false);
    setEditingId(null);
  }

  return (
    <section
      aria-labelledby="address-heading"
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="address-heading" className="type-h3 text-ink">
        {messages.vendor.address.heading}
      </h2>
      {!hasAddresses && !isAdding ? (
        <StateBlock
          icon={MapPin}
          title={messages.vendor.address.none}
          text={messages.vendor.address.noneText}
          titleAs="h3"
        />
      ) : null}
      <ul className="grid gap-3">
        {vendor.addresses.map((address) => (
          <li key={address.id}>
            {editingId === address.id ? (
              <AddressForm address={address} onDone={stopEditing} />
            ) : (
              <AddressCard address={address} onEdit={() => startEditing(address.id)} />
            )}
          </li>
        ))}
      </ul>
      {isAdding ? <AddressForm onDone={stopEditing} canCancel={hasAddresses} /> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isEditingNothing ? (
          <Button type="button" variant="secondary" onClick={startAdding}>
            {messages.vendor.address.add}
          </Button>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link href={vendorApplyPath(lang, ApplyStep.Documents)} className="no-underline">
            {messages.vendor.continueStep}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function AddressCard({ address, onEdit }: { address: VendorAddress; onEdit: () => void }) {
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
    </div>
  );
}
