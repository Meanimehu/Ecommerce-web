'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ErrorSummary } from '@/components/form/error-summary';
import { Form } from '@/components/form/form';
import { SelectField } from '@/components/form/select-field';
import { TextField } from '@/components/form/text-field';
import { TextareaField } from '@/components/form/textarea-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { resolveMessage } from '@/hooks/use-app-form';
import { fill } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCouponPath, adminCouponsPath } from '@/lib/routes';
import { useCategoryTree } from '@/features/storefront/product-list/hooks/use-product-list';
import { useCouponForm } from '@/features/coupon/hooks/use-coupon-form';
import { useStaffCoupon } from '@/features/coupon/hooks/use-coupons';
import { DiscountType, FundedBy, FUNDED_BY, type Coupon } from '@/features/coupon/types';
import { categoryPaths } from './coupon-text';

/**
 * The staff's coupon form (Document 5, section 8.3): a new coupon, or a change to one's terms. The
 * discount is typed as a percentage or in rupees, limits and dates may be left empty, times are in
 * IST. "Who pays" decides whether a vendor id and Dhaaga's share are needed. A coupon can be
 * limited to categories (from the public tree) and to products (by id: there is no staff product
 * search). It only draws; what happens on save is in `use-coupon-form.ts`.
 */
const FIELD_IDS = {
  code: 'coupon-code',
  discountType: 'coupon-discount-type',
  value: 'coupon-value',
  maxDiscount: 'coupon-max-discount',
  minCart: 'coupon-min-cart',
  startsAt: 'coupon-starts',
  endsAt: 'coupon-ends',
  usageLimit: 'coupon-usage-limit',
  perUserLimit: 'coupon-per-user-limit',
  excludeSaleItems: 'coupon-exclude-sale',
  fundedBy: 'coupon-funded-by',
  vendorId: 'coupon-vendor',
  marketplaceShare: 'coupon-share',
  categoryIds: 'coupon-categories',
  productIds: 'coupon-products',
} as const;

/** A new coupon. */
export function NewCouponForm({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staff;
  return (
    <FormFrame
      title={staffMessages.newTitle}
      crumbs={[
        { label: staffMessages.title, href: adminCouponsPath(lang) },
        { label: staffMessages.newTitle },
      ]}
    >
      <CouponFormBody lang={lang} />
    </FormFrame>
  );
}

/** A change to a coupon's terms; it reads the coupon first. */
export function ChangeCouponForm({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const staffMessages = messages.coupon.staff;
  const staffCoupon = useStaffCoupon(id);
  const code = staffCoupon.data?.code ?? '';
  const title = code ? fill(staffMessages.changeTitle, { code }) : staffMessages.change;

  let content;
  if (staffCoupon.isPending) content = <LoadingBlock messages={messages} lines={8} />;
  else if (staffCoupon.isError) {
    content = (
      <PartError
        error={staffCoupon.error}
        onRetry={() => void staffCoupon.refetch()}
        messages={messages}
      />
    );
  } else content = <CouponFormBody lang={lang} coupon={staffCoupon.data} />;

  return (
    <FormFrame
      title={title}
      crumbs={[
        { label: staffMessages.title, href: adminCouponsPath(lang) },
        ...(code ? [{ label: code, href: adminCouponPath(lang, id) }] : []),
        { label: staffMessages.change },
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
  children: React.ReactNode;
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

function CouponFormBody({ lang, coupon }: { lang: Locale; coupon?: Coupon }) {
  const messages = useMessages();
  const couponMessages = messages.coupon;
  const fieldMessages = couponMessages.fields;
  const couponForm = useCouponForm({ lang, coupon });
  const { form } = couponForm;
  const categoryTree = useCategoryTree();
  const categories = categoryPaths(categoryTree.data?.items ?? []);
  const discountType = form.watch('discountType');
  const fundedBy = form.watch('fundedBy');
  const categoryError = form.formState.errors.categoryIds?.message;
  const cancelHref = coupon ? adminCouponPath(lang, coupon.id) : adminCouponsPath(lang);

  return (
    <Form
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
      onSubmit={form.handleSubmit(couponForm.saveCoupon, couponForm.showValidationErrors)}
    >
      <ErrorSummary
        form={form}
        fieldIds={FIELD_IDS}
        messages={messages}
        requestId={couponForm.requestId}
        focusSignal={couponForm.focusSignal}
      />
      <TextField
        form={form}
        name="code"
        id={FIELD_IDS.code}
        label={fieldMessages.code}
        description={coupon ? fieldMessages.codeFixed : fieldMessages.codeHelp}
        messages={messages}
        inputProps={{
          autoComplete: 'off',
          spellCheck: false,
          maxLength: 20,
          readOnly: Boolean(coupon),
          className: 'max-w-64 uppercase',
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          form={form}
          name="discountType"
          id={FIELD_IDS.discountType}
          label={fieldMessages.discountType}
          options={[
            { value: DiscountType.Percent, label: fieldMessages.percent },
            { value: DiscountType.Fixed, label: fieldMessages.fixed },
          ]}
          messages={messages}
        />
        <TextField
          form={form}
          name="value"
          id={FIELD_IDS.value}
          label={
            discountType === DiscountType.Percent
              ? fieldMessages.valuePercent
              : fieldMessages.valueRupees
          }
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="maxDiscount"
          id={FIELD_IDS.maxDiscount}
          label={fieldMessages.maxDiscount}
          optional
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
        />
        <TextField
          form={form}
          name="minCart"
          id={FIELD_IDS.minCart}
          label={fieldMessages.minCart}
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
          label={fieldMessages.startsAt}
          optional
          messages={messages}
          inputProps={{ type: 'datetime-local' }}
        />
        <TextField
          form={form}
          name="endsAt"
          id={FIELD_IDS.endsAt}
          label={fieldMessages.endsAt}
          optional
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
          label={fieldMessages.usageLimit}
          optional
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
        />
        <TextField
          form={form}
          name="perUserLimit"
          id={FIELD_IDS.perUserLimit}
          label={fieldMessages.perUserLimit}
          optional
          messages={messages}
          inputProps={{ inputMode: 'numeric', autoComplete: 'off', className: 'max-w-48' }}
        />
      </div>
      <p className="-mt-2 type-small text-ink-2">{fieldMessages.limitsHelp}</p>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
        <Checkbox id={FIELD_IDS.excludeSaleItems} {...form.register('excludeSaleItems')} />
        <span>{fieldMessages.excludeSaleItems}</span>
      </label>
      <SelectField
        form={form}
        name="fundedBy"
        id={FIELD_IDS.fundedBy}
        label={fieldMessages.fundedBy}
        options={FUNDED_BY.map((value) => ({ value, label: couponMessages.fundedBy[value] }))}
        messages={messages}
      />
      <TextField
        form={form}
        name="vendorId"
        id={FIELD_IDS.vendorId}
        label={fieldMessages.vendorId}
        description={fieldMessages.vendorHelp}
        optional={fundedBy === FundedBy.Marketplace}
        messages={messages}
        inputProps={{ autoComplete: 'off', spellCheck: false, maxLength: 36 }}
      />
      {fundedBy === FundedBy.Split ? (
        <TextField
          form={form}
          name="marketplaceShare"
          id={FIELD_IDS.marketplaceShare}
          label={fieldMessages.marketplaceShare}
          description={fieldMessages.marketplaceShareHelp}
          messages={messages}
          inputProps={{ inputMode: 'decimal', autoComplete: 'off', className: 'max-w-48' }}
        />
      ) : null}
      <fieldset
        id={FIELD_IDS.categoryIds}
        tabIndex={-1}
        aria-describedby="coupon-categories-help"
        aria-invalid={categoryError ? true : undefined}
        className="grid gap-2 outline-none"
      >
        <legend className="type-label text-ink">
          {fieldMessages.categories}{' '}
          <span className="font-normal text-muted-foreground">{messages.form.optional}</span>
        </legend>
        <p id="coupon-categories-help" className="type-small text-ink-2">
          {fieldMessages.categoriesHelp}
        </p>
        {categoryError ? (
          <p className="type-small text-error">{resolveMessage(categoryError, messages)}</p>
        ) : null}
        <div className="grid max-h-64 gap-1 overflow-y-auto rounded-1 border border-line p-3 sm:grid-cols-2">
          {categories.map(({ id, path }) => (
            <label key={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
              <Checkbox value={id} {...form.register('categoryIds')} />
              <span>{path}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextareaField
        form={form}
        name="productIds"
        id={FIELD_IDS.productIds}
        label={fieldMessages.products}
        description={fieldMessages.productsHelp}
        optional
        messages={messages}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button asChild variant="quiet">
          <Link href={cancelHref}>{messages.common.cancel}</Link>
        </Button>
        <Button type="submit" loading={couponForm.isSaving}>
          {coupon ? fieldMessages.save : fieldMessages.create}
        </Button>
      </div>
    </Form>
  );
}
