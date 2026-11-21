'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myCouponRequestPath, myCouponRequestsPath } from '@/lib/routes';
import { useMyProducts } from '@/features/product/hooks/use-product';
import { ProductStatus } from '@/features/product/types';
import { useCategoryTree } from '@/features/storefront/product-list/hooks/use-product-list';
import { useMyCouponRequest } from '@/features/coupon/hooks/use-coupons';
import { useRequestForm } from '@/features/coupon/hooks/use-request-form';
import { DiscountType, REQUEST_NOTE_MAX_LENGTH, type CouponRequest } from '@/features/coupon/types';
import { ChoiceList } from './choice-list';
import { categoryPaths } from './coupon-text';

/**
 * The vendor's coupon request form (Document 5, section 8.2): a code it would like, a note, the
 * discount, a minimum, dates in IST, the limits, and the categories and its own products the coupon
 * covers. The vendor pays all of it, so there is no "who pays". The backend's current limits are
 * said above the form. It only draws; what happens on save is in `use-request-form.ts`.
 */
const FIELD_IDS = {
  proposedCode: 'request-code',
  note: 'request-note',
  discountType: 'request-discount-type',
  value: 'request-value',
  maxDiscount: 'request-max-discount',
  minCart: 'request-min-cart',
  startsAt: 'request-starts',
  endsAt: 'request-ends',
  usageLimit: 'request-usage-limit',
  perUserLimit: 'request-per-user-limit',
  excludeSaleItems: 'request-exclude-sale',
  categoryIds: 'request-categories',
  productIds: 'request-products',
} as const;

/** The most of the vendor's approved products offered to choose from (one page of the list). */
const PRODUCT_CHOICES_LIMIT = 100;

export function NewRequestForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  return (
    <FormFrame
      title={requestMessages.newTitle}
      crumbs={[
        { label: requestMessages.title, href: myCouponRequestsPath(lang) },
        { label: requestMessages.newTitle },
      ]}
    >
      <RequestFormBody lang={lang} />
    </FormFrame>
  );
}

export function ChangeRequestForm({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const requestMessages = messages.coupon.requests;
  const myRequest = useMyCouponRequest(id);

  let content: ReactNode;
  if (myRequest.isPending) content = <LoadingBlock messages={messages} lines={8} />;
  else if (myRequest.isError) {
    content = (
      <PartError
        error={myRequest.error}
        onRetry={() => void myRequest.refetch()}
        messages={messages}
      />
    );
  } else content = <RequestFormBody lang={lang} request={myRequest.data} />;

  return (
    <FormFrame
      title={requestMessages.changeTitle}
      crumbs={[
        { label: requestMessages.title, href: myCouponRequestsPath(lang) },
        { label: requestMessages.changeTitle },
      ]}
    >
      {content}
    </FormFrame>
  );
}

function FormFrame({
  title,
  crumbs,
  children,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  children: ReactNode;
}) {
  const messages = useMessages();
  return (
    <div className="grid max-w-[760px] gap-5">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{title}</h1>
      {children}
    </div>
  );
}

function RequestFormBody({ lang, request }: { lang: Locale; request?: CouponRequest }) {
  const messages = useMessages();
  const couponFields = messages.coupon.fields;
  const fieldMessages = messages.coupon.requests.fields;
  const requestForm = useRequestForm({ lang, request });
  const { form } = requestForm;
  const categoryTree = useCategoryTree();
  const myProducts = useMyProducts({
    status: ProductStatus.Approved,
    limit: PRODUCT_CHOICES_LIMIT,
  });
  const discountType = form.watch('discountType');
  const cancelHref = request ? myCouponRequestPath(lang, request.id) : myCouponRequestsPath(lang);

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(requestForm.saveRequest, requestForm.showValidationErrors)}
    >
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={requestForm.requestId}
        focusSignal={requestForm.focusSignal}
      />
      <p className="type-small text-ink-2">{fieldMessages.rulesHelp}</p>
      <TextField
        form={form}
        name="proposedCode"
        id={FIELD_IDS.proposedCode}
        label={fieldMessages.proposedCode}
        description={fieldMessages.proposedCodeHelp}
        optional
        messages={messages}
        inputProps={{
          autoComplete: 'off',
          spellCheck: false,
          maxLength: 20,
          className: 'max-w-64 uppercase',
        }}
      />
      <TextareaField
        form={form}
        name="note"
        id={FIELD_IDS.note}
        label={fieldMessages.note}
        description={fieldMessages.noteHelp}
        optional
        maxLength={REQUEST_NOTE_MAX_LENGTH}
        messages={messages}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="discountType"
          id={FIELD_IDS.discountType}
          label={couponFields.discountType}
          options={[
            { value: DiscountType.Fixed, label: couponFields.fixed },
            { value: DiscountType.Percent, label: couponFields.percent },
          ]}
          messages={messages}
        />
        <TextField
          form={form}
          name="value"
          id={FIELD_IDS.value}
          label={
            discountType === DiscountType.Percent
              ? couponFields.valuePercent
              : couponFields.valueRupees
          }
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {discountType === DiscountType.Percent ? (
          <TextField
            form={form}
            name="maxDiscount"
            id={FIELD_IDS.maxDiscount}
            label={couponFields.maxDiscount}
            description={fieldMessages.maxDiscountHelp}
            messages={messages}
            inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
          />
        ) : null}
        <TextField
          form={form}
          name="minCart"
          id={FIELD_IDS.minCart}
          label={couponFields.minCart}
          optional
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="startsAt"
          id={FIELD_IDS.startsAt}
          label={couponFields.startsAt}
          messages={messages}
          inputProps={{ type: 'datetime-local' }}
        />
        <TextField
          form={form}
          name="endsAt"
          id={FIELD_IDS.endsAt}
          label={couponFields.endsAt}
          messages={messages}
          inputProps={{ type: 'datetime-local' }}
        />
      </div>
      <p className="-mt-2 type-small text-ink-2">{fieldMessages.timesHelp}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="usageLimit"
          id={FIELD_IDS.usageLimit}
          label={couponFields.usageLimit}
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
        />
        <TextField
          form={form}
          name="perUserLimit"
          id={FIELD_IDS.perUserLimit}
          label={couponFields.perUserLimit}
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
        />
      </div>
      <p className="-mt-2 type-small text-ink-2">{fieldMessages.limitsHelp}</p>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
        <Checkbox id={FIELD_IDS.excludeSaleItems} {...form.register('excludeSaleItems')} />
        <span>{couponFields.excludeSaleItems}</span>
      </label>
      <ChoiceList
        form={form}
        name="categoryIds"
        id={FIELD_IDS.categoryIds}
        legend={couponFields.categories}
        help={couponFields.categoriesHelp}
        choices={categoryPaths(categoryTree.data?.items ?? []).map(({ id, path }) => ({
          id,
          label: path,
        }))}
        messages={messages}
      />
      <ChoiceList
        form={form}
        name="productIds"
        id={FIELD_IDS.productIds}
        legend={fieldMessages.products}
        help={fieldMessages.productsHelp}
        empty={fieldMessages.noProducts}
        choices={(myProducts.data?.items ?? []).map((product) => ({
          id: product.id,
          label: product.title,
        }))}
        messages={messages}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="quiet">
          <Link href={cancelHref}>{messages.common.cancel}</Link>
        </Button>
        <Button type="submit" loading={requestForm.isSaving}>
          {request ? fieldMessages.saveChanges : fieldMessages.save}
        </Button>
      </div>
    </Form>
  );
}
