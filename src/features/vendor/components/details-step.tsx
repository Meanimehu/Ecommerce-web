'use client';

import type { FormEvent } from 'react';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { AfterSave, useVendorDetailsForm } from '@/features/vendor/hooks/use-vendor-details-form';
import { SELLER_TYPES, type Vendor } from '@/features/vendor/types';

/**
 * Step 1, business details (Document 5, section 7.1). It only draws; what happens on save is in
 * `features/vendor/hooks/use-vendor-details-form.ts`.
 */
const FIELD_IDS = {
  legalName: 'vendor-legal-name',
  displayName: 'vendor-display-name',
  gstin: 'vendor-gstin',
  sellerType: 'vendor-seller-type',
  contactEmail: 'vendor-email',
} as const;

/** The button that sent the form says where to go after saving. */
function afterSaveOf(event: FormEvent<HTMLFormElement>): AfterSave {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  return submitter?.getAttribute('value') === AfterSave.Later
    ? AfterSave.Later
    : AfterSave.Continue;
}

export function DetailsStep({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const messages = useMessages();
  const details = useVendorDetailsForm({ lang, vendor });
  const { form, saveDetails, showValidationErrors, isSaving } = details;

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    details.chooseAfterSave(afterSaveOf(event));
    void form.handleSubmit(saveDetails, showValidationErrors)(event);
  }

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={submitDetails}
    >
      <h2 className="type-h3 text-ink">{messages.vendor.steps.details}</h2>
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={details.requestId}
        focusSignal={details.focusSignal}
      />
      <SelectField
        form={form}
        name="sellerType"
        id={FIELD_IDS.sellerType}
        label={messages.vendor.fields.sellerType}
        placeholder={messages.form.choose}
        options={SELLER_TYPES.map((sellerType) => ({
          value: sellerType,
          label: messages.vendor.sellerTypes[sellerType],
        }))}
        messages={messages}
      />
      <TextField
        form={form}
        name="legalName"
        id={FIELD_IDS.legalName}
        label={messages.vendor.fields.legalName}
        description={messages.vendor.fields.legalNameHelp}
        messages={messages}
        inputProps={{ autoComplete: 'organization', maxLength: 200 }}
      />
      <TextField
        form={form}
        name="displayName"
        id={FIELD_IDS.displayName}
        label={messages.vendor.fields.displayName}
        description={messages.vendor.fields.displayNameHelp}
        messages={messages}
        inputProps={{ maxLength: 100 }}
      />
      <TextField
        form={form}
        name="gstin"
        id={FIELD_IDS.gstin}
        label={messages.vendor.fields.gstin}
        description={messages.vendor.fields.gstinHelp}
        optional
        messages={messages}
        inputProps={{
          maxLength: 15,
          autoCapitalize: 'characters',
          spellCheck: false,
          className: 'uppercase',
        }}
      />
      <TextField
        form={form}
        name="contactEmail"
        id={FIELD_IDS.contactEmail}
        label={messages.vendor.fields.contactEmail}
        messages={messages}
        inputProps={{ type: 'email', autoComplete: 'email', maxLength: 254 }}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          name="after"
          value={AfterSave.Later}
          variant="quiet"
          disabled={isSaving}
        >
          {messages.vendor.saveLater}
        </Button>
        <Button
          type="submit"
          name="after"
          value={AfterSave.Continue}
          loading={isSaving && details.afterSave === AfterSave.Continue}
          disabled={isSaving}
        >
          {messages.vendor.saveContinue}
        </Button>
      </div>
    </Form>
  );
}
