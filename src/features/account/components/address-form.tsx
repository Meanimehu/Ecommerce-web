'use client';

import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import { useAddressForm } from '@/features/account/hooks/use-address-form';
import type { Address } from '@/features/account/types';

const FIELD_IDS = {
  label: 'address-label',
  name: 'address-name',
  phone: 'address-phone',
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-city',
  state: 'address-state',
  pincode: 'address-pincode',
} as const;

/**
 * Add or change one saved address (Document 5, section 6.5). It only draws; what happens on save
 * is in `use-address-form.ts`.
 */
export function AddressForm({ address, onDone }: { address?: Address; onDone: () => void }) {
  const messages = useMessages();
  const addressMessages = messages.account.address;
  const addressForm = useAddressForm({ address, onDone });
  const { form, saveAddress, showValidationErrors, isSaving } = addressForm;

  return (
    <Form
      className="grid gap-4 rounded-1 border border-control bg-surface p-4 sm:p-5"
      onSubmit={form.handleSubmit(saveAddress, showValidationErrors)}
    >
      <h2 className="type-h3 text-ink">
        {address ? addressMessages.editTitle : addressMessages.addTitle}
      </h2>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={addressForm.requestId}
        focusSignal={addressForm.focusSignal}
      />
      <TextField
        form={form}
        name="label"
        id={FIELD_IDS.label}
        label={addressMessages.label}
        description={addressMessages.labelHelp}
        optional
        messages={messages}
        inputProps={{ maxLength: 30 }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="name"
          id={FIELD_IDS.name}
          label={addressMessages.name}
          messages={messages}
          inputProps={{ autoComplete: 'name', maxLength: 100 }}
        />
        <TextField
          form={form}
          name="phone"
          id={FIELD_IDS.phone}
          label={addressMessages.phone}
          prefix="+91"
          messages={messages}
          inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }}
        />
      </div>
      <TextField
        form={form}
        name="line1"
        id={FIELD_IDS.line1}
        label={addressMessages.line1}
        messages={messages}
        inputProps={{ autoComplete: 'address-line1', maxLength: 200 }}
      />
      <TextField
        form={form}
        name="line2"
        id={FIELD_IDS.line2}
        label={addressMessages.line2}
        optional
        messages={messages}
        inputProps={{ autoComplete: 'address-line2', maxLength: 200 }}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          form={form}
          name="city"
          id={FIELD_IDS.city}
          label={addressMessages.city}
          messages={messages}
          inputProps={{ autoComplete: 'address-level2', maxLength: 100 }}
        />
        <TextField
          form={form}
          name="state"
          id={FIELD_IDS.state}
          label={addressMessages.state}
          messages={messages}
          inputProps={{ autoComplete: 'address-level1', maxLength: 100 }}
        />
        <TextField
          form={form}
          name="pincode"
          id={FIELD_IDS.pincode}
          label={addressMessages.pincode}
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 }}
        />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" disabled={isSaving} onClick={onDone}>
          {messages.common.cancel}
        </Button>
        <Button type="submit" loading={isSaving}>
          {addressMessages.save}
        </Button>
      </div>
    </Form>
  );
}
