'use client';

import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { ReasonDialog } from '@/components/common/reason-dialog';
import { useToast } from '@/components/common/toast';
import { PhotoFrame } from '@/components/common/photo-frame';
import { ProductStatusChip } from './product-status-chip';
import { reviewPhotoSrc, useDecision, useForReview } from '@/features/product/hooks/use-moderation';
import { useCategoryTree } from '@/hooks/use-category-tree';
import { messageFor, toAppError, type AppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { findInTree } from '@/types/catalogue';
import type { ModerationView } from '@/features/product/types';
import { formatRate, formatRupees } from '@/utils/format';

/**
 * One product for review (Document 5, section 8.3; approved Stage 5): what the vendor sends (content, attributes,
 * tax, variants, photos through our server), and the decision. Approving sends the time the screen was loaded
 * (seenUpdatedAt): if the vendor changed the product meanwhile the backend refuses (REVIEW_STALE), and the screen
 * says so and shows the latest version (V5-4). A vendor-declared tax must be confirmed. A reviewer never reviews their
 * own vendor's product (REVIEW_OWN_VENDOR).
 */
export function ModerationReview({ lang, id }: { lang: Locale; id: string }) {
  const t = useMessages();
  const m = t.moderation;
  const review = useForReview(id);
  const own = review.error && toAppError(review.error).code === 'REVIEW_OWN_VENDOR';
  return (
    <div className="grid max-w-[960px] gap-5">
      <Breadcrumbs label={t.nav.breadcrumbs} items={[{ label: m.title, href: `/${lang}/admin/moderation` }, { label: review.data?.product.title ?? m.product }]} />
      {review.isPending ? (
        <LoadingBlock messages={t} lines={6} />
      ) : own ? (
        <Banner tone="warning" title={m.ownVendor}>
          {m.ownVendorText}
        </Banner>
      ) : review.isError ? (
        <PartError error={review.error} onRetry={() => void review.refetch()} messages={t} />
      ) : (
        <Review view={review.data} />
      )}
    </div>
  );
}

function Review({ view }: { view: ModerationView }) {
  const t = useMessages();
  const m = t.moderation;
  const toast = useToast();
  const decide = useDecision(view.product.id);
  const tree = useCategoryTree();
  const [confirmTax, setConfirmTax] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const { product } = view;
  const waiting = product.status === 'submitted' && view.awaiting === 'listing';
  const category = findInTree(tree.data?.items ?? [], (node) => node.id === product.categoryId)?.map((node) => node.name).join(' › ');

  const approve = () => {
    setError(null);
    decide.mutate(
      { decision: 'approve', body: { seenUpdatedAt: view.seenUpdatedAt, ...(view.taxConfirmationRequired ? { confirmTax } : {}) } },
      { onSuccess: () => toast(m.approved), onError: (raw) => setError(toAppError(raw)) },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{product.title}</h1>
        <ProductStatusChip status={product.status} t={t} />
      </div>
      <p className="text-ink-2">
        {m.vendor}: <span className="text-ink">{view.vendor.displayName}</span>
      </p>
      {view.missing?.length ? (
        <Banner tone="warning" title={m.incomplete}>
          <ul className="list-disc ps-5">
            {view.missing.map((item) => (
              <li key={item}>{(t.product.review.items as Record<string, string>)[item] ?? item}</li>
            ))}
          </ul>
        </Banner>
      ) : null}

      <Card title={m.content}>
        <dl className="grid gap-2">
          <Row label={t.product.fields.category}>{category ?? '—'}</Row>
          <Row label={t.product.fields.description}>
            <span className="whitespace-pre-line">{product.description ?? '—'}</span>
          </Row>
          {Object.entries(product.attributes).map(([key, value]) => (
            <Row key={key} label={key}>
              {String(value)}
            </Row>
          ))}
          <Row label={t.product.fields.tax}>
            {[product.hsnCode, product.gstRateBps === null ? null : formatRate(product.gstRateBps)].filter(Boolean).join(', ') || '—'}{' '}
            <span className="text-ink-2">({product.taxSource === 'vendor_declared' ? m.taxDeclared : m.taxDefault})</span>
          </Row>
        </dl>
      </Card>

      <Card title={t.product.steps.variants}>
        <ul className="grid divide-y divide-line">
          {view.variants.map((v) => (
            <li key={v.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-ink">
                {[v.sku, v.sizeCode, v.colourCode].filter(Boolean).join(', ')}
                {v.status === 'inactive' ? ` (${t.product.variant.inactive})` : ''}
              </span>
              <span className="tabular-nums text-ink">
                {formatRupees(v.pricePaise)} <span className="text-muted-foreground line-through">{formatRupees(v.mrpPaise)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t.product.steps.photos}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {view.images.live.map((photo, index) => (
            <li key={photo.id} className="grid gap-1">
              <PhotoFrame src={reviewPhotoSrc(product.id, photo.id, 'medium')} alt={photo.altText ?? ''} unavailable={t.common.photoUnavailable} />
              <p className="type-caption text-ink-2">{index === 0 ? t.product.photos.main : (photo.altText ?? '')}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={m.decision}>
        {error ? (
          error.code === 'REVIEW_STALE' ? (
            <Banner tone="warning" role="alert" title={m.stale}>
              {m.staleText}
            </Banner>
          ) : (
            <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} messages={t} />
          )
        ) : null}
        {waiting ? (
          <>
            {view.taxConfirmationRequired ? (
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-ink">
                <Checkbox checked={confirmTax} onChange={(event) => setConfirmTax(event.target.checked)} />
                <span>{m.confirmTax}</span>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="button" loading={decide.isPending && decide.variables?.decision === 'approve'} disabled={decide.isPending || (view.taxConfirmationRequired && !confirmTax)} onClick={approve}>
                <Check aria-hidden="true" />
                {m.approve}
              </Button>
              <ReasonDialog
                messages={t}
                trigger={
                  <Button type="button" variant="destructive" disabled={decide.isPending}>
                    {m.reject}
                  </Button>
                }
                title={m.rejectTitle}
                body={m.rejectBody}
                label={t.adminVendors.reasonLabel}
                confirmLabel={m.rejectConfirm}
                maxLength={1000}
                onConfirm={(reason) =>
                  decide.mutateAsync({ decision: 'reject', body: { seenUpdatedAt: view.seenUpdatedAt, reason } }).then(() => {
                    setError(null);
                    toast(m.rejected);
                  })
                }
              />
            </div>
            <p className="type-small text-muted-foreground">{m.decisionHelp}</p>
          </>
        ) : (
          <p className="text-ink-2">{m.nothingWaiting}</p>
        )}
      </Card>
    </>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid content-start gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 className="type-h3 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3">
      <dt className="type-small text-ink-2">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}
