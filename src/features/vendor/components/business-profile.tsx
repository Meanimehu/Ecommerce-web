'use client';

import { useRef, useState, type ReactNode } from 'react';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { TextField } from '@/components/form/text-field';
import { Button } from '@/components/ui/button';
import { useInPlaceFormFocus } from '@/hooks/use-in-place-form-focus';
import { useMessages } from '@/lib/messages-context';
import { useProfileDetailsForm } from '@/features/vendor/hooks/use-profile-details-form';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { DOCUMENT_TYPES, isSellerType, VendorStatus, type Vendor } from '@/features/vendor/types';
import { AddressForm } from './address-form';
import { DocumentRow } from './document-row';
import { VendorAddressCard } from './vendor-address-card';

/**
 * The business profile (Document 5, section 8.2; approved Stage 5): the details, the pickup and
 * return addresses and the documents. An approved vendor changes the shop name and contact email,
 * adds, edits and removes addresses, and uploads a replacement document (area-2-vendors.md,
 * statuses). Any other status reads only; the Vendor area's banner says why and links to the
 * application, where a draft or a rejected application is changed. The backend decides each change.
 */
export function BusinessProfile() {
  const messages = useMessages();
  const myVendor = useMyVendor();

  let content: ReactNode;
  if (myVendor.isPending) content = <LoadingBlock messages={messages} />;
  else if (myVendor.isError) {
    content = (
      <PartError
        error={myVendor.error}
        onRetry={() => void myVendor.refetch()}
        messages={messages}
      />
    );
  } else if (myVendor.data) {
    const vendor = myVendor.data;
    const canChange = vendor.status === VendorStatus.Approved;
    content = (
      <>
        <DetailsSection vendor={vendor} canChange={canChange} />
        <AddressesSection vendor={vendor} canChange={canChange} />
        <DocumentsSection vendor={vendor} canChange={canChange} />
      </>
    );
  }

  return (
    <div className="grid max-w-[720px] gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{messages.vendor.profile.title}</h1>
      {content}
    </div>
  );
}

const SECTION_CLASS = 'grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6';

function DetailsSection({ vendor, canChange }: { vendor: Vendor; canChange: boolean }) {
  const messages = useMessages();
  const profileMessages = messages.vendor.profile;
  const fields = messages.vendor.fields;
  const [isEditing, setIsEditing] = useState(false);
  const section = useRef<HTMLElement>(null);
  useInPlaceFormFocus(isEditing, section);

  function stopEditing() {
    setIsEditing(false);
  }

  const sellerType =
    vendor.sellerType && isSellerType(vendor.sellerType)
      ? messages.vendor.sellerTypes[vendor.sellerType]
      : profileMessages.noValue;
  const rows = [
    { label: fields.legalName, value: vendor.legalName },
    { label: fields.displayName, value: vendor.displayName },
    { label: fields.sellerType, value: sellerType },
    { label: fields.gstin, value: vendor.gstin ?? profileMessages.noValue },
    { label: fields.contactEmail, value: vendor.contactEmail ?? profileMessages.noValue },
  ];

  return (
    <section ref={section} aria-labelledby="profile-details-heading" className={SECTION_CLASS}>
      <h2 id="profile-details-heading" tabIndex={-1} className="type-h3 text-ink">
        {profileMessages.details}
      </h2>
      {isEditing ? (
        <DetailsForm vendor={vendor} onDone={stopEditing} />
      ) : (
        <>
          <dl className="grid gap-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid gap-0.5 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-x-6"
              >
                <dt className="type-label text-ink-2">{row.label}</dt>
                <dd className="break-words text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
          {canChange ? (
            <div>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                {profileMessages.editDetails}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

const DETAIL_FIELD_IDS = {
  displayName: 'profile-display-name',
  contactEmail: 'profile-email',
} as const;

function DetailsForm({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const messages = useMessages();
  const profileMessages = messages.vendor.profile;
  const details = useProfileDetailsForm({ vendor, onDone });
  const { form, saveDetails, showValidationErrors, isSaving } = details;

  return (
    <Form className="grid gap-4" onSubmit={form.handleSubmit(saveDetails, showValidationErrors)}>
      <ErrorSummary
        form={form}
        fieldIds={DETAIL_FIELD_IDS}
        messages={messages}
        requestId={details.requestId}
        focusSignal={details.focusSignal}
      />
      <p className="type-small text-ink-2">{profileMessages.locked}</p>
      <TextField
        form={form}
        name="displayName"
        id={DETAIL_FIELD_IDS.displayName}
        label={messages.vendor.fields.displayName}
        description={messages.vendor.fields.displayNameHelp}
        messages={messages}
        inputProps={{ maxLength: 100 }}
      />
      <TextField
        form={form}
        name="contactEmail"
        id={DETAIL_FIELD_IDS.contactEmail}
        label={messages.vendor.fields.contactEmail}
        messages={messages}
        inputProps={{ type: 'email', autoComplete: 'email', maxLength: 254 }}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={isSaving}>
          {profileMessages.save}
        </Button>
        <Button type="button" variant="quiet" disabled={isSaving} onClick={onDone}>
          {messages.common.cancel}
        </Button>
      </div>
    </Form>
  );
}

function AddressesSection({ vendor, canChange }: { vendor: Vendor; canChange: boolean }) {
  const messages = useMessages();
  const addressMessages = messages.vendor.address;
  // One address form at a time: a new one, or the one being changed.
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const section = useRef<HTMLElement>(null);
  useInPlaceFormFocus(isAdding ? 'new' : editingId, section);

  function stopEditing() {
    setIsAdding(false);
    setEditingId(null);
  }

  return (
    <section ref={section} aria-labelledby="profile-addresses-heading" className={SECTION_CLASS}>
      <h2 id="profile-addresses-heading" tabIndex={-1} className="type-h3 text-ink">
        {addressMessages.heading}
      </h2>
      {vendor.addresses.length === 0 ? <p className="text-ink-2">{addressMessages.none}</p> : null}
      <ul className="grid gap-3">
        {vendor.addresses.map((address) => (
          <li key={address.id}>
            {editingId === address.id ? (
              <AddressForm address={address} onDone={stopEditing} />
            ) : (
              <VendorAddressCard
                address={address}
                onEdit={
                  canChange
                    ? () => {
                        setIsAdding(false);
                        setEditingId(address.id);
                      }
                    : undefined
                }
              />
            )}
          </li>
        ))}
      </ul>
      {isAdding ? <AddressForm onDone={stopEditing} /> : null}
      {canChange && !isAdding && editingId === null ? (
        <div>
          <Button type="button" variant="secondary" onClick={() => setIsAdding(true)}>
            {addressMessages.add}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function DocumentsSection({ vendor, canChange }: { vendor: Vendor; canChange: boolean }) {
  const messages = useMessages();
  return (
    <section aria-labelledby="profile-documents-heading" className={SECTION_CLASS}>
      <h2 id="profile-documents-heading" className="type-h3 text-ink">
        {messages.vendor.steps.documents}
      </h2>
      <ul className="grid gap-3">
        {DOCUMENT_TYPES.map((type) => (
          <li key={type}>
            <DocumentRow vendor={vendor} type={type} canChange={canChange} />
          </li>
        ))}
      </ul>
      {canChange ? (
        <p className="type-small text-ink-2">
          {messages.vendor.profile.documentsText} {messages.vendor.documents.help}
        </p>
      ) : null}
    </section>
  );
}
