'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { PhotoFrame } from '@/components/common/photo-frame';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { useCategoryTree } from '@/features/storefront/hooks/use-storefront';
import { BackendErrorCode } from '@/lib/error-codes';
import { messageFor, type AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { moderationQueuePath } from '@/lib/routes';
import { findInTree } from '@/features/storefront/types';
import { reviewPhotoSrc, useProductForReview } from '@/features/product/hooks/use-product';
import { useProductDecision } from '@/features/product/hooks/use-product-decision';
import {
  PhotoSize,
  ProductStatus,
  ReviewKind,
  TaxSource,
  VariantStatus,
  type ModerationView,
} from '@/features/product/types';
import { formatRate, formatRupees } from '@/utils/format';
import { ProductStatusChip } from './product-status-chip';

/**
 * One product for review (Document 5, section 8.3; approved Stage 5): what the vendor sends
 * (content, attributes, tax, variants, photos through our server), and the decision. Approving
 * sends the time the screen was loaded (seenUpdatedAt): if the vendor changed the product
 * meanwhile the backend refuses (REVIEW_STALE), and the screen says so and shows the latest version
 * (V5-4). A vendor-declared tax must be confirmed. A reviewer never reviews their own vendor's
 * product (REVIEW_OWN_VENDOR). It only draws; the decisions are in `use-product-decision.ts`.
 */
const REASON_MAX_LENGTH = 1000;

export function ModerationReview({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  const productForReview = useProductForReview(id);
  const crumbs = [
    { label: moderationMessages.title, href: moderationQueuePath(lang) },
    { label: productForReview.data?.product.title ?? moderationMessages.product },
  ];

  function reviewBody() {
    if (productForReview.isPending) return <LoadingBlock messages={messages} lines={6} />;
    if (productForReview.error?.code === BackendErrorCode.ReviewOwnVendor) {
      return (
        <Banner tone="warning" title={moderationMessages.ownVendor}>
          {moderationMessages.ownVendorText}
        </Banner>
      );
    }
    if (productForReview.isError) {
      return (
        <PartError
          error={productForReview.error}
          onRetry={() => void productForReview.refetch()}
          messages={messages}
        />
      );
    }
    return <Review view={productForReview.data} />;
  }

  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      {reviewBody()}
    </div>
  );
}

function Review({ view }: { view: ModerationView }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  const productMessages = messages.product;
  const productDecision = useProductDecision(view);
  const categoryTree = useCategoryTree();
  const { product } = view;
  const isWaiting =
    product.status === ProductStatus.Submitted && view.awaiting === ReviewKind.Listing;
  const categoryPath = findInTree(
    categoryTree.data?.items ?? [],
    (node) => node.id === product.categoryId,
  )
    ?.map((node) => node.name)
    .join(' › ');
  const rate = product.gstRateBps === null ? null : formatRate(product.gstRateBps);
  const taxSourceText =
    product.taxSource === TaxSource.VendorDeclared
      ? moderationMessages.taxDeclared
      : moderationMessages.taxDefault;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{product.title}</h1>
        <ProductStatusChip status={product.status} messages={messages} />
      </div>
      <p className="text-ink-2">
        {moderationMessages.vendor}: <span className="text-ink">{view.vendor.displayName}</span>
      </p>
      {view.missing?.length ? (
        <Banner tone="warning" title={moderationMessages.incomplete}>
          <ul className="list-disc ps-5">
            {view.missing.map((item) => (
              <li key={item}>
                {(productMessages.review.items as Record<string, string>)[item] ?? item}
              </li>
            ))}
          </ul>
        </Banner>
      ) : null}

      <ReviewSection title={moderationMessages.content}>
        <dl className="grid gap-2">
          <ReviewDetail label={productMessages.fields.category}>{categoryPath ?? '—'}</ReviewDetail>
          <ReviewDetail label={productMessages.fields.description}>
            <span className="whitespace-pre-line">{product.description ?? '—'}</span>
          </ReviewDetail>
          {Object.entries(product.attributes).map(([key, value]) => (
            <ReviewDetail key={key} label={key}>
              {String(value)}
            </ReviewDetail>
          ))}
          <ReviewDetail label={productMessages.fields.tax}>
            {[product.hsnCode, rate].filter(Boolean).join(', ') || '—'}{' '}
            <span className="text-ink-2">({taxSourceText})</span>
          </ReviewDetail>
        </dl>
      </ReviewSection>

      <ReviewSection title={productMessages.steps.variants}>
        <ul className="grid divide-y divide-line">
          {view.variants.map((variant) => (
            <li key={variant.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-ink">
                {[variant.sku, variant.sizeCode, variant.colourCode].filter(Boolean).join(', ')}
                {variant.status === VariantStatus.Inactive
                  ? ` (${productMessages.variant.inactive})`
                  : ''}
              </span>
              <span className="tabular-nums text-ink">
                {formatRupees(variant.pricePaise)}{' '}
                <span className="text-muted-foreground line-through">
                  {formatRupees(variant.mrpPaise)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </ReviewSection>

      <ReviewSection title={productMessages.steps.photos}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {view.images.live.map((photo, index) => (
            <li key={photo.id} className="grid gap-1">
              <PhotoFrame
                src={reviewPhotoSrc(product.id, photo.id, PhotoSize.Medium)}
                alt={photo.altText ?? ''}
                unavailable={messages.common.photoUnavailable}
              />
              <p className="type-caption text-ink-2">
                {index === 0 ? productMessages.photos.main : (photo.altText ?? '')}
              </p>
            </li>
          ))}
        </ul>
      </ReviewSection>

      <ReviewSection title={moderationMessages.decision}>
        <DecisionError error={productDecision.decisionError} />
        {isWaiting ? (
          <>
            {view.taxConfirmationRequired ? (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
                <Checkbox
                  checked={productDecision.isTaxConfirmed}
                  onChange={(event) => productDecision.setIsTaxConfirmed(event.target.checked)}
                />
                <span>{moderationMessages.confirmTax}</span>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                loading={productDecision.isApproving}
                disabled={productDecision.isDeciding || !productDecision.canApprove}
                onClick={productDecision.approveProduct}
              >
                <Check aria-hidden="true" />
                {moderationMessages.approve}
              </Button>
              <ReasonDialog
                messages={messages}
                trigger={
                  <Button type="button" variant="destructive" disabled={productDecision.isDeciding}>
                    {moderationMessages.reject}
                  </Button>
                }
                title={moderationMessages.rejectTitle}
                body={moderationMessages.rejectBody}
                label={messages.adminVendors.reasonLabel}
                confirmLabel={moderationMessages.rejectConfirm}
                maxLength={REASON_MAX_LENGTH}
                onConfirm={productDecision.rejectProduct}
              />
            </div>
            <p className="type-small text-muted-foreground">{moderationMessages.decisionHelp}</p>
          </>
        ) : (
          <p className="text-ink-2">{moderationMessages.nothingWaiting}</p>
        )}
      </ReviewSection>
    </>
  );
}

/** A refused decision: a stale product says so as a warning; anything else is an error. */
function DecisionError({ error }: { error: AppError | null }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  if (!error) return null;
  if (error.code === BackendErrorCode.ReviewStale) {
    return (
      <Banner tone="warning" role="alert" title={moderationMessages.stale}>
        {moderationMessages.staleText}
      </Banner>
    );
  }
  return (
    <ErrorMessage
      text={messageFor(error, messages)}
      requestId={error.requestId}
      messages={messages}
    />
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid content-start gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 className="type-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function ReviewDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <dt className="type-small text-ink-2">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}
