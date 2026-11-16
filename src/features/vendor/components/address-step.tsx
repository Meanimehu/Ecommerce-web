'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { vendorApplyPath } from '@/lib/routes';
import { ApplyStep, type Vendor } from '@/features/vendor/types';
import { AddressForm } from './address-form';
import { VendorAddressCard } from './vendor-address-card';

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
              <VendorAddressCard address={address} onEdit={() => startEditing(address.id)} />
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
