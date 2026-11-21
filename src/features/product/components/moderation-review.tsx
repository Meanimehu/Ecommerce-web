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
import {
  useBrands,
  useCategoryTree,
} from '@/features/storefront/product-list/hooks/use-product-list';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, messageFor, type AppError } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { moderationQueuePath, staffStockHistoryPath } from '@/lib/routes';
import { findInTree } from '@/features/storefront/product-list/rules';
import { reviewPhotoSrc, useProductForReview } from '@/features/product/hooks/use-product';
import { useProductDecision } from '@/features/product/hooks/use-product-decision';
import {
  PhotoSize,
  ProductStatus,
  ReviewKind,
  RevisionField,
  TaxSource,
  VariantStatus,
  type ModerationView,
} from '@/features/product/types';
import { formatRate, formatRupees } from '@/utils/format';
import { ProductStatusChip } from './product-status-chip';
import {
  photosText,
  photoCountText,
  RevisionComparison,
  type ComparedRow,
} from './revision-comparison';

/**
 * One product for review (Document 5, section 8.3; approved Stage 5): what the vendor sends
 * (content, attributes, tax, variants, photos through our server), and the decision. For a
 * revision of an approved product, the live version and the revision side by side with each change
 * marked, and the proposed photos; approving puts the revision live in one step, and rejecting
 * leaves the live product as it was. Approving
 * sends the time the screen was loaded (seenUpdatedAt): if the vendor changed the product
 * meanwhile the backend refuses (REVIEW_STALE), and the screen says so and shows the latest version
 * (V5-4). A vendor-declared tax must be confirmed. A reviewer never reviews their own vendor's
 * product (REVIEW_OWN_VENDOR). It only draws; the decisions are in `use-product-decision.ts`.
 */
const REASON_MAX_LENGTH = 1000;
/** Enough brands for every brand a product can name (the public list, area-3a-catalogue.md). */
const BRAND_LIMIT = 100;

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
    return <Review lang={lang} view={productForReview.data} />;
  }

  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      {reviewBody()}
    </div>
  );
}

function Review({ lang, view }: { lang: Locale; view: ModerationView }) {
  const messages = useMessages();
  const moderationMessages = messages.moderation;
  const productMessages = messages.product;
  const productDecision = useProductDecision(view);
  const categoryTree = useCategoryTree();
  const { product } = view;
  const isRevision = view.awaiting === ReviewKind.Revision && view.revision !== null;
  const isWaiting =
    isRevision ||
    (product.status === ProductStatus.Submitted && view.awaiting === ReviewKind.Listing);
  const decisionText = isRevision ? moderationMessages.revision : moderationMessages;
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

      {isRevision && view.revision ? (
        <RevisionUnderReview view={view} revision={view.revision} />
      ) : null}

      <ReviewSection
        title={isRevision ? moderationMessages.revision.liveContent : moderationMessages.content}
      >
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
              <span className="flex flex-wrap items-center gap-4">
                <span className="tabular-nums text-ink">
                  {formatRupees(variant.pricePaise)}{' '}
                  <span className="text-muted-foreground line-through">
                    {formatRupees(variant.mrpPaise)}
                  </span>
                </span>
                <a
                  href={staffStockHistoryPath(lang, variant.id)}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {moderationMessages.stockHistory}
                  <span className="sr-only">: {variant.sku}</span>
                </a>
              </span>
            </li>
          ))}
        </ul>
      </ReviewSection>

      <ReviewSection
        title={isRevision ? moderationMessages.revision.livePhotos : productMessages.steps.photos}
      >
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
                {decisionText.approve}
              </Button>
              <ReasonDialog
                messages={messages}
                trigger={
                  <Button type="button" variant="destructive" disabled={productDecision.isDeciding}>
                    {moderationMessages.reject}
                  </Button>
                }
                title={decisionText.rejectTitle}
                body={decisionText.rejectBody}
                label={messages.adminVendors.reasonLabel}
                confirmLabel={decisionText.rejectConfirm}
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

type RevisionView = NonNullable<ModerationView['revision']>;

/** The revision waiting for review: the comparison and the proposed photos. */
function RevisionUnderReview({ view, revision }: { view: ModerationView; revision: RevisionView }) {
  const messages = useMessages();
  const revisionMessages = messages.moderation.revision;
  const categoryTree = useCategoryTree();
  const brands = useBrands(null, BRAND_LIMIT);
  const proposedPhotos = view.images.proposed ?? [];
  const rows = comparedRows(view, revision, {
    categoryName: (id) =>
      findInTree(categoryTree.data?.items ?? [], (node) => node.id === id)
        ?.map((node) => node.name)
        .join(' › ') ?? id,
    brandName: (id) => brands.data?.find((brand) => brand.id === id)?.name ?? id,
    messages,
  });
  return (
    <ReviewSection title={revisionMessages.title}>
      <p className="text-ink-2">{revisionMessages.intro}</p>
      <RevisionComparison rows={rows} proposedHeader={revisionMessages.proposedColumn} />
      <h3 className="type-h4 text-ink">{revisionMessages.proposedPhotos}</h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {proposedPhotos.map((photo) => (
          <li key={photo.id} className="grid gap-1">
            <PhotoFrame
              src={reviewPhotoSrc(view.product.id, photo.id, PhotoSize.Medium)}
              alt={photo.altText ?? ''}
              unavailable={messages.common.photoUnavailable}
            />
            <p className="type-caption text-ink-2">
              {photo.isCover ? messages.product.photos.main : (photo.altText ?? '')}
              {revision.photoChanges.added.includes(photo.id)
                ? ` (${revisionMessages.newPhoto})`
                : ''}
            </p>
          </li>
        ))}
      </ul>
      {revision.photoChanges.removed.length > 0 ? (
        <p className="type-small text-ink-2">
          {fill(revisionMessages.removedPhotos, { count: revision.photoChanges.removed.length })}
        </p>
      ) : null}
    </ReviewSection>
  );
}

/** Every value a revision can change, live and proposed, named from the public lists. */
function comparedRows(
  view: ModerationView,
  revision: RevisionView,
  names: {
    categoryName: (id: string) => string;
    brandName: (id: string) => string;
    messages: Messages;
  },
): ComparedRow[] {
  const { messages } = names;
  const fieldMessages = messages.product.fields;
  const revisionMessages = messages.product.revision;
  const changed = new Set(revision.changes);
  const live = view.product;
  const proposed = revision.content;
  const brandText = (id: string | null) => (id ? names.brandName(id) : messages.product.noBrand);
  const taxText = (content: typeof proposed) =>
    content.taxSource === TaxSource.VendorDeclared && content.hsnCode && content.gstRateBps !== null
      ? `HSN ${content.hsnCode}, GST ${formatRate(content.gstRateBps)}`
      : revisionMessages.taxDefault;
  const attributeText = (values: Record<string, unknown>) =>
    Object.entries(values)
      .filter(([, value]) => value !== null && value !== '')
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('\n') || '—';
  const rows: ComparedRow[] = [
    {
      key: RevisionField.Title,
      label: fieldMessages.title,
      live: live.title,
      proposed: proposed.title,
      isChanged: changed.has(RevisionField.Title),
    },
    {
      key: RevisionField.CategoryId,
      label: fieldMessages.category,
      live: names.categoryName(live.categoryId),
      proposed: names.categoryName(proposed.categoryId),
      isChanged: changed.has(RevisionField.CategoryId),
    },
    {
      key: RevisionField.BrandId,
      label: fieldMessages.brand,
      live: brandText(live.brandId),
      proposed: brandText(proposed.brandId),
      isChanged: changed.has(RevisionField.BrandId),
    },
    {
      key: RevisionField.Description,
      label: fieldMessages.description,
      live: live.description ?? revisionMessages.notGiven,
      proposed: proposed.description ?? revisionMessages.notGiven,
      isChanged: changed.has(RevisionField.Description),
    },
    {
      key: RevisionField.Attributes,
      label: revisionMessages.attributes,
      live: attributeText(live.attributes),
      proposed: attributeText(proposed.attributes),
      isChanged: changed.has(RevisionField.Attributes),
    },
    {
      key: RevisionField.HsnCode,
      label: fieldMessages.tax,
      live: taxText(live),
      proposed: taxText(proposed),
      isChanged: changed.has(RevisionField.HsnCode) || changed.has(RevisionField.GstRateBps),
    },
  ];
  const { added, removed, reordered, altTextChanged } = revision.photoChanges;
  rows.push({
    key: 'photos',
    label: revisionMessages.photos,
    live: photoCountText(view.images.live.length, messages),
    proposed: photosText((view.images.proposed ?? []).length, revision.photoChanges, messages),
    isChanged: added.length > 0 || removed.length > 0 || reordered || altTextChanged.length > 0,
  });
  return rows;
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
