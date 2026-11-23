'use client';

import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/lib/messages-context';
import { useVendorAddressForm } from '@/features/vendor/hooks/use-vendor-address-form';
import { AddressType, type VendorAddress } from '@/features/vendor/types';

/**
 * Add or change one vendor address. It only draws; what happens on save is in
 * `features/vendor/hooks/use-vendor-address-form.ts`.
 */
const FIELD_IDS = {
  type: 'address-type',
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-city',
  state: 'address-state',
  pincode: 'address-pincode',
  contactPhone: 'address-phone',
} as const;

export function AddressForm({
  address,
  onDone,
  canCancel = true,
}: {
  address?: VendorAddress;
  onDone: () => void;
  canCancel?: boolean;
}) {
  const messages = useMessages();
  const addressMessages = messages.vendor.address;
  const addressForm = useVendorAddressForm({ address, onDone });
  const { form, saveAddress, showValidationErrors, isSaving } = addressForm;

  return (
    <Form
      className="grid gap-4 rounded-1 border border-control p-4"
      onSubmit={form.handleSubmit(saveAddress, showValidationErrors)}
    >
      <h3 className="type-h4 text-ink">
        {address ? addressMessages.editTitle : addressMessages.add}
      </h3>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={addressForm.requestId}
        focusSignal={addressForm.focusSignal}
      />
      <SelectField
        form={form}
        name="type"
        id={FIELD_IDS.type}
        label={addressMessages.type}
        options={[
          { value: AddressType.Pickup, label: addressMessages.types[AddressType.Pickup] },
          { value: AddressType.Return, label: addressMessages.types[AddressType.Return] },
        ]}
        messages={messages}
      />
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="pincode"
          id={FIELD_IDS.pincode}
          label={addressMessages.pincode}
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 }}
        />
        <TextField
          form={form}
          name="contactPhone"
          id={FIELD_IDS.contactPhone}
          label={addressMessages.contactPhone}
          prefix="+91"
          messages={messages}
          inputProps={{ type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' }}
        />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {canCancel ? (
          <Button type="button" variant="quiet" busy={isSaving} onClick={onDone}>
            {messages.common.cancel}
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" loading={isSaving}>
          {addressMessages.save}
        </Button>
      </div>
    </Form>
  );
}
