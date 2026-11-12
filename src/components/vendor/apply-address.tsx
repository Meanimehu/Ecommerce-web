'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { ErrorMessage } from '@/components/common/error-message';
import { StateBlock } from '@/components/common/state-block';
import { useToast } from '@/components/common/toast';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { addressBody, useRemoveAddress, useSaveAddress } from '@/hooks/use-vendor';
import { fill, messageFor, requestIdOf, toAppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatPhone } from '@/utils/format';
import { AddressSchema, type AddressInput, type Vendor, type VendorAddress } from '@/types/vendor';

/**
 * Step 2, pickup address (Document 5, section 7.1): the addresses on the application, each with Edit and Remove, and a
 * form to add one. At least one pickup address is needed to submit (the backend's `missing` list says so); a return
 * address is optional. A vendor can hold up to 5 addresses; the backend says when that is reached.
 */
export function AddressStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const t = useMessages();
  const [editing, setEditing] = useState<VendorAddress | 'new' | null>(vendor.addresses.length ? null : 'new');
  const base = `/${lang}/vendor/apply`;
  return (
    <section aria-labelledby="address-heading" className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="address-heading" className="type-h3 text-ink">
        {t.vendor.address.heading}
      </h2>
      {vendor.addresses.length === 0 && editing !== 'new' ? (
        <StateBlock icon={MapPin} title={t.vendor.address.none} text={t.vendor.address.noneText} titleAs="h3" />
      ) : null}
      <ul className="grid gap-3">
        {vendor.addresses.map((address) =>
          editing !== 'new' && editing?.id === address.id ? (
            <li key={address.id}>
              <AddressForm address={address} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={address.id}>
              <AddressCard address={address} onEdit={() => setEditing(address)} />
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? <AddressForm onDone={() => setEditing(null)} canCancel={vendor.addresses.length > 0} /> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {editing === null ? (
          <Button type="button" variant="secondary" onClick={() => setEditing('new')}>
            {t.vendor.address.add}
          </Button>
        ) : (
          <span />
        )}
        <Button asChild>
          <Link href={`${base}?step=documents`} className="no-underline">
            {t.vendor.continueStep}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function AddressCard({ address, onEdit }: { address: VendorAddress; onEdit: () => void }) {
  const t = useMessages();
  const toast = useToast();
  const removeAddress = useRemoveAddress();
  const oneLine = [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ');
  return (
    <div className="grid gap-3 rounded-1 border border-line p-4">
      <div className="grid gap-1">
        <p className="type-label text-ink">{t.vendor.address.types[address.type]}</p>
        <p className="text-ink">{oneLine}</p>
        <p className="type-small text-ink-2 tabular-nums">{formatPhone(address.contactPhone)}</p>
      </div>
      {removeAddress.error ? <ErrorMessage text={messageFor(toAppError(removeAddress.error), t)} requestId={requestIdOf(removeAddress.error)} messages={t} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="small" onClick={onEdit}>
          {t.vendor.address.edit}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="small" disabled={removeAddress.isPending}>
              {t.vendor.address.remove}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.vendor.address.removeTitle}</AlertDialogTitle>
              <AlertDialogDescription>{fill(t.vendor.address.removeBody, { address: oneLine })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructiveConfirm" onClick={() => removeAddress.mutate(address.id, { onSuccess: () => toast(t.vendor.address.removed) })}>
                {t.vendor.address.remove}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

const IDS = {
  type: 'address-type',
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-city',
  state: 'address-state',
  pincode: 'address-pincode',
  contactPhone: 'address-phone',
} as const;

function AddressForm({ address, onDone, canCancel = true }: { address?: VendorAddress; onDone: () => void; canCancel?: boolean }) {
  const t = useMessages();
  const toast = useToast();
  const save = useSaveAddress();
  const [focus, setFocus] = useState(0);
  const form = useAppForm<AddressInput, AddressInput>(AddressSchema, {
    type: address?.type ?? 'pickup',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
    contactPhone: address ? address.contactPhone.replace(/^\+91/, '') : '',
  });
  const submit = form.handleSubmit(
    async (values) => {
      try {
        const body = addressBody(values);
        if (address && !values.line2?.trim() && address.line2) body.line2 = '';
        await save.mutateAsync({ id: address?.id, values: body });
        toast(t.vendor.address.saved);
        onDone();
      } catch (error) {
        applyServerError(form, toAppError(error), t);
        setFocus((n) => n + 1);
      }
    },
    () => setFocus((n) => n + 1),
  );
  return (
    <form method="post" noValidate className="grid gap-4 rounded-1 border border-control p-4" onSubmit={(event) => void submit(event)}>
      <h3 className="type-h4 text-ink">{address ? t.vendor.address.editTitle : t.vendor.address.add}</h3>
      <ErrorSummary form={form} fieldIds={IDS} messages={t} requestId={requestIdOf(save.error)} focusSignal={focus} />
      <SelectField
        form={form}
        name="type"
        id={IDS.type}
        label={t.vendor.address.type}
        options={[
          { value: 'pickup', label: t.vendor.address.types.pickup },
          { value: 'return', label: t.vendor.address.types.return },
        ]}
        messages={t}
      />
      <TextField form={form} name="line1" id={IDS.line1} label={t.vendor.address.line1} messages={t} inputProps={{ autoComplete: 'address-line1', maxLength: 200 }} />
      <TextField form={form} name="line2" id={IDS.line2} label={t.vendor.address.line2} optional messages={t} inputProps={{ autoComplete: 'address-line2', maxLength: 200 }} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="city" id={IDS.city} label={t.vendor.address.city} messages={t} inputProps={{ autoComplete: 'address-level2', maxLength: 100 }} />
        <TextField form={form} name="state" id={IDS.state} label={t.vendor.address.state} messages={t} inputProps={{ autoComplete: 'address-level1', maxLength: 100 }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="pincode" id={IDS.pincode} label={t.vendor.address.pincode} messages={t} inputProps={{ inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 }} />
        <TextField form={form} name="contactPhone" id={IDS.contactPhone} label={t.vendor.address.contactPhone} prefix="+91" messages={t} inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }} />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <Button type="button" variant="quiet" disabled={save.isPending} onClick={onDone}>
            {t.common.cancel}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" loading={save.isPending}>
          {t.vendor.address.save}
        </Button>
      </div>
    </form>
  );
}
