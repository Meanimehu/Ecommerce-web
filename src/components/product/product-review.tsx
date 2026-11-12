'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { useToast } from '@/components/common/toast';
import { useDeleteProduct, useSubmitProduct } from '@/hooks/use-product';
import { fill, messageFor, toAppError, type AppError } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import type { ProductView } from '@/types/product';
import { productStepFor } from './product-steps';

/**
 * Step 5, review (Document 5, section 7.3): the backend's `missing` list as a checklist, each item linking to the step
 * that fixes it; "Submit for review" stays off until the list is empty, and the backend decides in the end. A draft
 * that was never submitted can also be deleted here.
 */
export function ReviewStep({ lang, product }: { lang: Locale; product: ProductView }) {
  const t = useMessages();
  const p = t.product;
  const router = useRouter();
  const toast = useToast();
  const submit = useSubmitProduct(product.id);
  const deleteProduct = useDeleteProduct(product.id);
  const [error, setError] = useState<AppError | null>(null);
  const missing = product.missing;
  const base = `/${lang}/vendor/products/${product.id}`;
  // What the product needs: the four parts it is always checked on, and anything else the backend lists.
  const always = ['attributes', 'variant', 'image'];
  const checklist = [
    ...missing.filter((m) => !always.includes(m)).map((key) => ({ key, missing: true })),
    ...always.map((key) => ({ key, missing: missing.includes(key) })),
  ];

  return (
    <section aria-labelledby="review-heading" className="grid gap-5 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="review-heading" className="type-h3 text-ink">
        {p.steps.review}
      </h2>
      {missing.length === 0 ? (
        <Banner tone="success">{p.review.ready}</Banner>
      ) : (
        <Banner tone="error" title={missing.length === 1 ? p.missingOne : fill(p.missingMany, { count: missing.length })}>
          {p.review.fixFirst}
        </Banner>
      )}
      <ul className="grid divide-y divide-line">
        {checklist.map((item) => {
          const name = (p.review.items as Record<string, string>)[item.key] ?? item.key;
          return (
            <li key={item.key} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2">
              <span className={item.missing ? 'flex items-center gap-2 text-ink' : 'flex items-center gap-2 text-success'}>
                {item.missing ? <TriangleAlert aria-hidden="true" className="size-4 text-warning" /> : <CircleCheck aria-hidden="true" className="size-4" />}
                {name}
                <span className="sr-only">: {item.missing ? t.vendor.review.isMissing : t.vendor.review.isDone}</span>
              </span>
              {item.missing ? (
                <Link href={`${base}?step=${productStepFor(item.key)}`} className="inline-flex min-h-11 items-center type-small underline underline-offset-4">
                  {p.review.goToStep}
                  <span className="sr-only">: {name}</span>
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} messages={t} /> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {product.status === 'draft' && !product.submittedAt ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={deleteProduct.isPending}>
                {p.review.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{fill(p.review.deleteTitle, { title: product.title })}</AlertDialogTitle>
                <AlertDialogDescription>{p.review.deleteBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructiveConfirm"
                  onClick={() =>
                    deleteProduct.mutate(undefined, {
                      onSuccess: () => {
                        toast(p.review.deleted);
                        router.push(`/${lang}/vendor/products`);
                      },
                      onError: (raw) => setError(toAppError(raw)),
                    })
                  }
                >
                  {p.review.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <Button
          type="button"
          loading={submit.isPending}
          disabled={missing.length > 0 || submit.isPending}
          onClick={() => {
            setError(null);
            submit.mutate(undefined, { onSuccess: () => toast(p.review.submitted), onError: (raw) => setError(toAppError(raw)) });
          }}
        >
          {p.review.submit}
        </Button>
      </div>
      <p className="type-small text-muted-foreground">{p.review.submitHelp}</p>
    </section>
  );
}
