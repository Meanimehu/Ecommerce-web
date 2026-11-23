'use client';

import { useRef, useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
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
import { useInPlaceFormFocus } from '@/hooks/use-in-place-form-focus';
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { formatPhone } from '@/utils/format';
import { useAddressActions } from '@/features/account/hooks/use-address-actions';
import { useAddresses } from '@/features/account/hooks/use-account';
import { MAX_ADDRESSES, type Address } from '@/features/account/types';
import { AddressForm } from './address-form';

/** No form open, the form for a new address, or the id of the address being changed. */
const NEW_ADDRESS = 'new';

/**
 * Saved addresses (Document 5, section 6.5; approved Stage 5 screens): default first, each with
 * its label, "Default", the name and phone and the address on one line, and "Edit", "Delete" (with
 * a confirmation) and "Make default". "Add a new address" opens the form in place, up to 10
 * addresses. When a form opens, focus goes to its heading; when it closes, back to the list's
 * heading (`use-in-place-form-focus.ts`).
 */
export function AddressList({ drawn }: { drawn: Address[] }) {
  const messages = useMessages();
  const addressMessages = messages.account.address;
  const addresses = useAddresses(drawn).data;
  const actions = useAddressActions();
  const [editing, setEditing] = useState<string | null>(null);
  const section = useRef<HTMLElement>(null);
  const isFull = addresses.length >= MAX_ADDRESSES;
  useInPlaceFormFocus(editing, section);

  function closeForm() {
    setEditing(null);
  }

  return (
    <section ref={section} aria-labelledby="addresses-heading" className="grid gap-4">
      <h2 id="addresses-heading" tabIndex={-1} className="type-h3 text-ink">
        {addressMessages.heading}
      </h2>
      {actions.error ? (
        <ErrorMessage
          text={messageFor(actions.error, messages)}
          requestId={actions.error.requestId}
          messages={messages}
        />
      ) : null}
      {addresses.length === 0 && editing !== NEW_ADDRESS ? (
        <div className="grid gap-1 rounded-1 border border-dashed border-control bg-surface px-6 py-8 text-center">
          <p className="font-medium text-ink">{addressMessages.none}</p>
          <p className="text-ink-2">{addressMessages.noneText}</p>
        </div>
      ) : null}
      <ul className="grid gap-3">
        {addresses.map((address) =>
          editing === address.id ? (
            <li key={address.id}>
              <AddressForm address={address} onDone={closeForm} />
            </li>
          ) : (
            <li key={address.id}>
              <AddressCard
                address={address}
                isBusy={actions.busyId === address.id}
                onEdit={() => setEditing(address.id)}
                onRemove={() => actions.remove(address.id)}
                onMakeDefault={() => actions.makeDefault(address.id)}
              />
            </li>
          ),
        )}
      </ul>
      {editing === NEW_ADDRESS ? <AddressForm onDone={closeForm} /> : null}
      {editing === null && !isFull ? (
        <div>
          <Button type="button" variant="secondary" onClick={() => setEditing(NEW_ADDRESS)}>
            {addressMessages.add}
          </Button>
        </div>
      ) : null}
      {isFull ? <p className="text-ink-2">{addressMessages.limitReached}</p> : null}
    </section>
  );
}

function AddressCard({
  address,
  isBusy,
  onEdit,
  onRemove,
  onMakeDefault,
}: {
  address: Address;
  isBusy: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMakeDefault: () => void;
}) {
  const messages = useMessages();
  const addressMessages = messages.account.address;
  const oneLine = [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');
  const title = address.label ?? oneLine;

  return (
    <article
      aria-label={title}
      className="grid gap-3 rounded-1 border border-line bg-surface p-4 sm:p-5"
    >
      <div className="grid gap-1">
        <p className="flex flex-wrap items-center gap-2">
          {address.label ? <span className="type-label text-ink">{address.label}</span> : null}
          {address.isDefault ? (
            <span className="rounded-1 bg-ink px-2 py-0.5 type-caption font-medium text-surface">
              {addressMessages.isDefault}
            </span>
          ) : null}
        </p>
        <p className="text-ink">
          {address.name} · <span className="tabular-nums">{formatPhone(address.phone)}</span>
        </p>
        <p className="text-ink-2">{oneLine}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="small" busy={isBusy} onClick={onEdit}>
          {addressMessages.edit}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="small" busy={isBusy}>
              {addressMessages.remove}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{addressMessages.removeTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {fill(addressMessages.removeBody, { address: oneLine })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructiveConfirm" onClick={onRemove}>
                {addressMessages.remove}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {address.isDefault ? null : (
          <Button
            type="button"
            variant="quiet"
            size="small"
            loading={isBusy}
            onClick={onMakeDefault}
          >
            {addressMessages.makeDefault}
          </Button>
        )}
      </div>
    </article>
  );
}
