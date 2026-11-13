'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/form/error-summary';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { useToast } from '@/components/common/toast';
import { applyServerError, useAppForm } from '@/hooks/use-app-form';
import { useApply, useUpdateVendor } from '@/features/vendor/hooks/use-vendor';
import { requestIdOf, toAppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { VendorDetailsFormSchema, SELLER_TYPES, type VendorDetailsFormInput, type Vendor } from '@/features/vendor/types';

/**
 * Step 1, business details (Document 5, section 7.1). A new application is started with POST /vendors/apply; after that
 * only the fields the person changed are sent (PATCH /vendors/me). The backend checks the GSTIN and the email.
 */
const IDS = {
  legalName: 'vendor-legal-name',
  displayName: 'vendor-display-name',
  gstin: 'vendor-gstin',
  sellerType: 'vendor-seller-type',
  contactEmail: 'vendor-email',
} as const;

export function DetailsStep({ lang, vendor }: { lang: Locale; vendor: Vendor | null }) {
  const t = useMessages();
  const router = useRouter();
  const toast = useToast();
  const apply = useApply();
  const update = useUpdateVendor();
  const [focus, setFocus] = useState(0);
  const [after, setAfter] = useState<'continue' | 'later'>('continue');
  const form = useAppForm<VendorDetailsFormInput, VendorDetailsFormInput>(VendorDetailsFormSchema, {
    legalName: vendor?.legalName ?? '',
    displayName: vendor?.displayName ?? '',
    gstin: vendor?.gstin ?? '',
    sellerType: vendor?.sellerType ?? '',
    contactEmail: vendor?.contactEmail ?? '',
  });
  const base = `/${lang}/vendor/apply`;
  const busy = apply.isPending || update.isPending;

  const save = (next: 'continue' | 'later') =>
    form.handleSubmit(
      async (values) => {
        const dirty = form.formState.dirtyFields;
        const body: Record<string, unknown> = {};
        for (const key of Object.keys(values) as (keyof VendorDetailsFormInput)[]) {
          if (vendor && !dirty[key]) continue;
          const value = values[key]?.trim() ?? '';
          if (key === 'gstin') {
            if (value) body.gstin = value;
            else if (vendor?.gstin) body.gstin = null;
          } else {
            body[key] = value;
          }
        }
        try {
          if (!vendor) await apply.mutateAsync(body);
          else if (Object.keys(body).length) await update.mutateAsync(body);
          toast(t.vendor.saved);
          router.push(next === 'continue' ? `${base}?step=address` : base);
        } catch (error) {
          applyServerError(form, toAppError(error), t, {
            codes: { GSTIN_TAKEN: 'gstin' },
          });
          setFocus((n) => n + 1);
        }
      },
      () => setFocus((n) => n + 1),
    );

  // Which button sent the form decides where the person goes after saving.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const next = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'later' ? 'later' : 'continue';
    setAfter(next);
    void save(next)(event);
  };

  return (
    <form method="post" noValidate className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6" onSubmit={onSubmit}>
      <h2 className="type-h3 text-ink">{t.vendor.steps.details}</h2>
      <ErrorSummary form={form} fieldIds={IDS} messages={t} requestId={requestIdOf(apply.error ?? update.error)} focusSignal={focus} />
      <SelectField
        form={form}
        name="sellerType"
        id={IDS.sellerType}
        label={t.vendor.fields.sellerType}
        placeholder={t.form.choose}
        options={SELLER_TYPES.map((value) => ({
          value,
          label: t.vendor.sellerTypes[value],
        }))}
        messages={t}
      />
      <TextField
        form={form}
        name="legalName"
        id={IDS.legalName}
        label={t.vendor.fields.legalName}
        description={t.vendor.fields.legalNameHelp}
        messages={t}
        inputProps={{ autoComplete: 'organization', maxLength: 200 }}
      />
      <TextField
        form={form}
        name="displayName"
        id={IDS.displayName}
        label={t.vendor.fields.displayName}
        description={t.vendor.fields.displayNameHelp}
        messages={t}
        inputProps={{ maxLength: 100 }}
      />
      <TextField
        form={form}
        name="gstin"
        id={IDS.gstin}
        label={t.vendor.fields.gstin}
        description={t.vendor.fields.gstinHelp}
        optional
        messages={t}
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
        id={IDS.contactEmail}
        label={t.vendor.fields.contactEmail}
        messages={t}
        inputProps={{ type: 'email', autoComplete: 'email', maxLength: 254 }}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" name="after" value="later" variant="quiet" disabled={busy}>
          {t.vendor.saveLater}
        </Button>
        <Button type="submit" name="after" value="continue" loading={busy && after === 'continue'} disabled={busy}>
          {t.vendor.saveContinue}
        </Button>
      </div>
    </form>
  );
}
