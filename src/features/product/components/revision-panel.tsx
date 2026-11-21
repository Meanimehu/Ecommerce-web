'use client';

import { FilePen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StateBlock } from '@/components/common/state-block';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { messageFor } from '@/lib/errors';
import type { Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { formatRate } from '@/utils/format';
import { useRevision } from '@/features/product/hooks/use-product';
import { useRevisionActions } from '@/features/product/hooks/use-revision-actions';
import {
  canEditRevision,
  changesPhotos,
  findCategoryChoice,
  RevisionField,
  RevisionStatus,
  TaxSource,
  type Dictionaries,
  type ProductContent,
  type ProductView,
  type Revision,
} from '@/features/product/types';
import { RevisionEditor } from './revision-editor';
import {
  photoCountText,
  photosText,
  RevisionComparison,
  type ComparedRow,
} from './revision-comparison';

/**
 * An approved product's revision (Document 5, section 7.3; approved Stage 5, "Live version and
 * revision"): the live version and the proposed one side by side, each changed value marked in
 * words as well as colour, the revision's status and a rejected one's reason, what is still
 * missing, and the actions its status allows: Edit, Send for review and Discard while it is a draft
 * or was rejected, Withdraw while it waits. Only an approved vendor sees the actions. A part of its
 * own: if the revision cannot be read, it says so here and the live product still shows.
 */
const STATUS_TONES: Record<RevisionStatus, ChipTone> = {
  [RevisionStatus.Draft]: 'neutral',
  [RevisionStatus.Submitted]: 'info',
  [RevisionStatus.Rejected]: 'error',
};

export function RevisionPanel({
  product,
  dictionaries,
  isVendorApproved,
}: {
  product: ProductView;
  dictionaries: Dictionaries;
  isVendorApproved: boolean;
}) {
  const messages = useMessages();
  const revisionMessages = messages.product.revision;
  const revisionQuery = useRevision(product.id, true);
  const actions = useRevisionActions(product.id);
  const [isEditing, setIsEditing] = useState(false);

  let content: ReactNode;
  if (revisionQuery.isPending) content = <LoadingBlock messages={messages} />;
  else if (revisionQuery.isError) {
    content = (
      <PartError
        error={revisionQuery.error}
        onRetry={() => void revisionQuery.refetch()}
        messages={messages}
      />
    );
  } else {
    const revision = revisionQuery.data;
    const canEdit = isVendorApproved && (!revision || canEditRevision(revision.status));
    const missing = actions.missing.length > 0 ? actions.missing : (revision?.missing ?? []);
    content = (
      <>
        {revision?.status === RevisionStatus.Rejected && revision.reason ? (
          <Banner tone="error" title={messages.product.moderatorReason}>
            {/* The moderator's own words, as the backend sends them. */}
            <p className="whitespace-pre-line">{revision.reason}</p>
          </Banner>
        ) : null}
        {revision?.status === RevisionStatus.Submitted ? (
          <p className="text-ink-2">{revisionMessages.waitingText}</p>
        ) : null}
        {revision && canEditRevision(revision.status) && missing.length > 0 ? (
          <Banner tone="warning" title={revisionMessages.missingTitle}>
            <ul className="list-disc ps-5">
              {missing.map((item) => (
                <li key={item}>{missingText(item, messages)}</li>
              ))}
            </ul>
          </Banner>
        ) : null}
        {actions.actionError && actions.missing.length === 0 ? (
          <ErrorMessage
            text={messageFor(actions.actionError, messages)}
            requestId={actions.actionError.requestId}
            messages={messages}
          />
        ) : null}
        {revision ? (
          <Comparison product={product} revision={revision} dictionaries={dictionaries} />
        ) : null}
        {!revision && !isEditing ? (
          <StateBlock
            icon={FilePen}
            title={revisionMessages.none}
            text={revisionMessages.noneText}
            titleAs="h3"
          />
        ) : null}
        {isVendorApproved ? (
          <RevisionActions
            revision={revision}
            canEdit={canEdit}
            isEditing={isEditing}
            onEdit={setIsEditing}
            actions={actions}
          />
        ) : null}
        {isEditing && canEdit ? (
          <RevisionEditor product={product} revision={revision} dictionaries={dictionaries} />
        ) : null}
      </>
    );
  }

  const revision = revisionQuery.data;
  return (
    <section aria-labelledby="revision-heading" className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="revision-heading" className="type-h3 text-ink">
          {revisionMessages.compareTitle}
        </h2>
        {revision ? (
          <StatusChip
            tone={STATUS_TONES[revision.status]}
            label={revisionMessages.status[revision.status]}
          />
        ) : null}
      </div>
      {content}
    </section>
  );
}

/** The buttons the revision's status allows. */
function RevisionActions({
  revision,
  canEdit,
  isEditing,
  onEdit,
  actions,
}: {
  revision: Revision | null;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: (isEditing: boolean) => void;
  actions: ReturnType<typeof useRevisionActions>;
}) {
  const messages = useMessages();
  const revisionMessages = messages.product.revision;
  if (revision?.status === RevisionStatus.Submitted) {
    return (
      <div>
        <Button
          type="button"
          variant="secondary"
          loading={actions.isBusy}
          onClick={actions.withdraw}
        >
          {revisionMessages.withdraw}
        </Button>
      </div>
    );
  }
  if (!canEdit) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {isEditing ? (
        <Button type="button" variant="secondary" onClick={() => onEdit(false)}>
          {revisionMessages.doneEditing}
        </Button>
      ) : (
        <Button type="button" variant="secondary" onClick={() => onEdit(true)}>
          {revision ? revisionMessages.edit : revisionMessages.propose}
        </Button>
      )}
      {revision ? (
        <>
          <Button type="button" loading={actions.isBusy} onClick={actions.submit}>
            {revisionMessages.submit}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={actions.isBusy}>
                {revisionMessages.discard}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{revisionMessages.discardTitle}</AlertDialogTitle>
                <AlertDialogDescription>{revisionMessages.discardBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructiveConfirm"
                  onClick={() => {
                    onEdit(false);
                    actions.discard();
                  }}
                >
                  {revisionMessages.discard}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}

/** The live and proposed values of everything a revision can change, side by side. */
function Comparison({
  product,
  revision,
  dictionaries,
}: {
  product: ProductView;
  revision: Revision;
  dictionaries: Dictionaries;
}) {
  const messages = useMessages();
  const revisionMessages = messages.product.revision;
  const fieldMessages = messages.product.fields;
  const changed = new Set(revision.changes);
  const proposed = revision.content;
  const valueOf = (content: ProductContent) => contentText(content, dictionaries, messages);
  const live = valueOf(product);
  const next = valueOf(proposed);
  const liveAttributes = attributesText(product.attributes, product.categoryId, dictionaries);
  const nextAttributes = attributesText(proposed.attributes, proposed.categoryId, dictionaries);
  const rows: ComparedRow[] = [
    {
      key: RevisionField.Title,
      label: fieldMessages.title,
      live: live.title,
      proposed: next.title,
    },
    {
      key: RevisionField.CategoryId,
      label: fieldMessages.category,
      live: live.category,
      proposed: next.category,
    },
    {
      key: RevisionField.BrandId,
      label: fieldMessages.brand,
      live: live.brand,
      proposed: next.brand,
    },
    {
      key: RevisionField.Description,
      label: fieldMessages.description,
      live: live.description,
      proposed: next.description,
    },
    {
      key: RevisionField.Attributes,
      label: revisionMessages.attributes,
      live: liveAttributes,
      proposed: nextAttributes,
    },
    { key: RevisionField.HsnCode, label: fieldMessages.tax, live: live.tax, proposed: next.tax },
  ].map((row) => ({
    ...row,
    isChanged:
      changed.has(row.key) ||
      (row.key === RevisionField.HsnCode && changed.has(RevisionField.GstRateBps)),
  }));
  rows.push({
    key: 'photos',
    label: revisionMessages.photos,
    live: photoCountText(product.images.length, messages),
    proposed: photosText(revision.images.length, revision.photoChanges, messages),
    isChanged: changesPhotos(revision),
  });
  return <RevisionComparison rows={rows} />;
}

/** The content's values as text: names for the category and brand, the tax in words. */
function contentText(content: ProductContent, dictionaries: Dictionaries, messages: Messages) {
  const revisionMessages = messages.product.revision;
  const category = findCategoryChoice(dictionaries.categories, content.categoryId);
  const brand = dictionaries.brands.find((entry) => entry.id === content.brandId);
  const isDeclared =
    content.taxSource === TaxSource.VendorDeclared &&
    content.hsnCode !== null &&
    content.gstRateBps !== null;
  return {
    title: content.title,
    category: category?.path ?? content.categoryId,
    brand: content.brandId ? (brand?.name ?? content.brandId) : messages.product.noBrand,
    description: content.description ?? revisionMessages.notGiven,
    tax: isDeclared
      ? `HSN ${content.hsnCode}, GST ${formatRate(content.gstRateBps ?? 0)}`
      : revisionMessages.taxDefault,
  };
}

/** Each attribute as "Label: value", one a line, named from the category. */
function attributesText(
  values: Record<string, unknown>,
  categoryId: string,
  dictionaries: Dictionaries,
): string {
  const attributes = findCategoryChoice(dictionaries.categories, categoryId)?.category.attributes;
  const lines = Object.entries(values)
    .filter(([, value]) => value !== null && value !== '')
    .map(([key, value]) => {
      const label = attributes?.find((attribute) => attribute.key === key)?.label ?? key;
      return `${label}: ${String(value)}`;
    });
  return lines.length > 0 ? lines.join('\n') : '—';
}

/** One missing item in words, from the review step's list; one it does not know as it is. */
function missingText(item: string, messages: Messages): string {
  const items = messages.product.review.items as Record<string, string>;
  return items[item] ?? item;
}
