'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
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
import { ErrorMessage } from '@/components/common/error-message';
import { fill, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myProductPath } from '@/lib/routes';
import { useProductSubmit } from '@/features/product/hooks/use-product-submit';
import {
  ALWAYS_CHECKED,
  ProductStatus,
  productStepFor,
  type ProductView,
} from '@/features/product/types';
import { missingCountText } from './missing-count-text';

/**
 * Step 5, review (Document 5, section 7.3): the backend's `missing` list as a checklist, each item
 * linking to the step that fixes it; "Submit for review" stays off until the list is empty, and
 * the backend decides in the end. A draft that was never submitted can also be deleted here. It
 * only draws; the actions are in `use-product-submit.ts`.
 */
interface ChecklistItem {
  key: string;
  isMissing: boolean;
}

export function ReviewStep({ lang, product }: { lang: Locale; product: ProductView }) {
  const messages = useMessages();
  const productMessages = messages.product;
  const reviewMessages = productMessages.review;
  const productSubmit = useProductSubmit({ lang, productId: product.id });
  const { actionError } = productSubmit;
  const { missing } = product;
  const canDelete = product.status === ProductStatus.Draft && !product.submittedAt;
  // What the product needs: anything the backend lists, then the parts it is always checked on.
  const checklist: ChecklistItem[] = [
    ...missing
      .filter((item) => !(ALWAYS_CHECKED as readonly string[]).includes(item))
      .map((item) => ({ key: item, isMissing: true })),
    ...ALWAYS_CHECKED.map((item) => ({ key: item, isMissing: missing.includes(item) })),
  ];

  return (
    <section
      aria-labelledby="review-heading"
      className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="review-heading" className="type-h3 text-ink">
        {productMessages.steps.review}
      </h2>
      {missing.length === 0 ? (
        <Banner tone="success">{reviewMessages.ready}</Banner>
      ) : (
        <Banner tone="error" title={missingCountText(missing.length, productMessages)}>
          {reviewMessages.fixFirst}
        </Banner>
      )}
      <ul className="grid divide-y divide-line">
        {checklist.map((item) => {
          const name = (reviewMessages.items as Record<string, string>)[item.key] ?? item.key;
          return (
            <li
              key={item.key}
              className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2"
            >
              <span
                className={
                  item.isMissing
                    ? 'flex items-center gap-2 text-ink'
                    : 'flex items-center gap-2 text-success'
                }
              >
                {item.isMissing ? (
                  <TriangleAlert aria-hidden="true" className="size-4 text-warning" />
                ) : (
                  <CircleCheck aria-hidden="true" className="size-4" />
                )}
                {name}
                <span className="sr-only">
                  :{' '}
                  {item.isMissing
                    ? messages.vendor.review.isMissing
                    : messages.vendor.review.isDone}
                </span>
              </span>
              {item.isMissing ? (
                <Link
                  href={myProductPath(lang, product.id, productStepFor(item.key))}
                  className="inline-flex min-h-11 items-center type-small underline underline-offset-4"
                >
                  {reviewMessages.goToStep}
                  <span className="sr-only">: {name}</span>
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
      {actionError ? (
        <ErrorMessage
          text={messageFor(actionError, messages)}
          requestId={actionError.requestId}
          messages={messages}
        />
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={productSubmit.isDeleting}>
                {reviewMessages.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {fill(reviewMessages.deleteTitle, { title: product.title })}
                </AlertDialogTitle>
                <AlertDialogDescription>{reviewMessages.deleteBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="destructiveConfirm" onClick={productSubmit.deleteDraft}>
                  {reviewMessages.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <Button
          type="button"
          loading={productSubmit.isSubmitting}
          disabled={missing.length > 0 || productSubmit.isSubmitting}
          onClick={productSubmit.sendForReview}
        >
          {reviewMessages.submit}
        </Button>
      </div>
      <p className="type-small text-muted-foreground">{reviewMessages.submitHelp}</p>
    </section>
  );
}
