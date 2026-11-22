'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { StatusChip } from '@/components/common/status-chip';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myImportsPath, myProductPath, myProductsPath } from '@/lib/routes';
import { formatSize } from '@/lib/uploads';
import { formatDate, formatTime, isSingular } from '@/utils/format';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { useImportConfirm } from '@/features/product/hooks/use-import-confirm';
import { useMyImport } from '@/features/product/hooks/use-imports';
import {
  canConfirmImport,
  ImportState,
  importStateOf,
  type Import,
  type ImportIssue,
  type ImportProduct,
  type ImportRow,
} from '@/features/product/types';
import { ImportStateChip } from './import-state-chip';

/**
 * One import (Document 5, sections 7.3 and 11; area-3b-products.md, section 7): before confirm it
 * says nothing has been created, how many products are ready and until when; each product with its
 * lines in the file, and each row with a problem by its original line and column. Confirm is one
 * button, for an approved vendor only, and is not all or nothing: afterwards each product shows
 * whether it was created (with a link to the draft) or not, and why. Products are called created
 * only from the backend's answer or the import as read again. The backend writes its problem texts
 * in English. What happens on confirm is in `features/product/hooks/use-import-confirm.ts`.
 */
export function ImportView({ lang, id }: { lang: Locale; id: string }) {
  const messages = useMessages();
  const importMessages = messages.imports;
  const myImport = useMyImport(id);
  const myVendor = useMyVendor();
  const isApproved = myVendor.data?.status === VendorStatus.Approved;
  const importConfirm = useImportConfirm(id);
  const answer = useRef<HTMLDivElement>(null);

  // After a confirm, focus moves to what the screen now says.
  useEffect(() => {
    if (importConfirm.answerSignal > 0) answer.current?.focus();
  }, [importConfirm.answerSignal]);

  const crumbs = [
    { label: messages.product.title, href: myProductsPath(lang) },
    { label: importMessages.shortTitle, href: myImportsPath(lang) },
    { label: myImport.data?.fileName ?? importMessages.shortTitle },
  ];

  if (myImport.isPending) {
    return (
      <div className="grid gap-5">
        <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
        <LoadingBlock messages={messages} lines={6} />
      </div>
    );
  }
  if (myImport.isError) {
    return (
      <div className="grid gap-5">
        <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
        <h1 className="type-h2 text-ink">{importMessages.shortTitle}</h1>
        <PartError
          error={myImport.error}
          onRetry={() => void myImport.refetch()}
          messages={messages}
        />
      </div>
    );
  }

  const checked = myImport.data;
  const state = importStateOf(checked);
  const showsConfirm = isApproved && canConfirmImport(checked);
  const { confirmError } = importConfirm;
  const validProducts = checked.totals.validProducts;

  return (
    <div className="grid gap-6">
      <Breadcrumbs label={messages.nav.breadcrumbs} items={crumbs} />
      <div className="grid gap-2 stitch-bottom pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-h2 break-all text-ink">{checked.fileName}</h1>
          <ImportStateChip state={state} messages={messages} />
        </div>
        <p className="type-small text-ink-2">
          {fill(importMessages.view.uploaded, {
            date: `${formatDate(checked.createdAt, lang)} ${formatTime(checked.createdAt, lang)}`,
            size: formatSize(checked.fileSizeBytes),
          })}
        </p>
      </div>
      <div ref={answer} tabIndex={-1} className="grid gap-3 outline-none">
        {importConfirm.isOutcomeUnknown ? (
          <Banner tone="warning">{importMessages.view.confirmUnknown}</Banner>
        ) : null}
        {confirmError ? (
          <ErrorMessage
            text={messageFor(confirmError, messages)}
            requestId={confirmError.requestId}
            messages={messages}
          />
        ) : null}
        <StateBanner checked={checked} lang={lang} messages={messages} />
      </div>
      <div className="flex flex-wrap gap-3">
        {showsConfirm ? (
          <Button
            type="button"
            disabled={importConfirm.isConfirming}
            onClick={importConfirm.confirm}
          >
            {isSingular(validProducts)
              ? importMessages.view.confirmOne
              : fill(importMessages.view.confirmMany, { count: validProducts })}
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link href={myImportsPath(lang)} className="no-underline">
            {importMessages.view.uploadAnother}
          </Link>
        </Button>
      </div>
      <ProductsPart checked={checked} lang={lang} messages={messages} />
      <RowsPart rows={checked.rows} messages={messages} />
    </div>
  );
}

/** What the import holds now, in words: nothing created yet, expired, or what was created. */
function StateBanner({
  checked,
  lang,
  messages,
}: {
  checked: Import;
  lang: Locale;
  messages: Messages;
}) {
  const viewMessages = messages.imports.view;
  const { totals } = checked;
  const state = importStateOf(checked);
  if (state === ImportState.Confirmed) {
    return (
      <Banner tone="success">
        {fill(viewMessages.confirmed, {
          date: checked.confirmedAt ? formatDate(checked.confirmedAt, lang) : '',
          created: totals.createdProducts,
          total: totals.products,
        })}
      </Banner>
    );
  }
  if (state === ImportState.Expired) return <Banner tone="warning">{viewMessages.expired}</Banner>;
  if (totals.validProducts === 0) {
    return <Banner tone="warning">{viewMessages.waitingNone}</Banner>;
  }
  return (
    <Banner tone="info">
      {fill(viewMessages.waiting, {
        valid: totals.validProducts,
        total: totals.products,
        date: `${formatDate(checked.expiresAt, lang)} ${formatTime(checked.expiresAt, lang)}`,
      })}
    </Banner>
  );
}

/** Each product of the file: its lines, and whether it is ready, has problems, or was created. */
function ProductsPart({
  checked,
  lang,
  messages,
}: {
  checked: Import;
  lang: Locale;
  messages: Messages;
}) {
  const productMessages = messages.imports.view.products;
  const columns: Column<ImportProduct>[] = [
    {
      key: 'ref',
      header: productMessages.columns.ref,
      lead: true,
      cell: (product) => (
        <code className="font-medium break-all text-ink">{product.productRef}</code>
      ),
    },
    {
      key: 'title',
      header: productMessages.columns.title,
      cell: (product) => product.title || productMessages.noTitle,
    },
    {
      key: 'lines',
      header: productMessages.columns.lines,
      cell: (product) => <span className="tabular-nums">{product.lines.join(', ')}</span>,
    },
    {
      key: 'result',
      header: productMessages.columns.result,
      cell: (product) => <ProductResult product={product} lang={lang} messages={messages} />,
    },
  ];
  return (
    <section aria-labelledby="import-products-heading" className="grid gap-3">
      <h2 id="import-products-heading" className="type-h3 text-ink">
        {productMessages.title}
      </h2>
      <DataTable
        rows={checked.products}
        columns={columns}
        rowKey={(product) => product.productRef}
        caption={productMessages.title}
      />
    </section>
  );
}

function ProductResult({
  product,
  lang,
  messages,
}: {
  product: ImportProduct;
  lang: Locale;
  messages: Messages;
}) {
  const productMessages = messages.imports.view.products;
  const { outcome } = product;
  if (outcome?.created && outcome.productId) {
    return (
      <div className="grid justify-items-start gap-1">
        <StatusChip tone="success" label={productMessages.created} />
        <span className="type-small text-ink-2">
          {isSingular(outcome.variantCount)
            ? productMessages.variantsOne
            : fill(productMessages.variantsMany, { count: outcome.variantCount })}
        </span>
        <Link
          href={myProductPath(lang, outcome.productId)}
          className="inline-flex min-h-11 items-center type-small underline underline-offset-4"
        >
          {productMessages.openDraft}
          <span className="sr-only">: {product.title || product.productRef}</span>
        </Link>
      </div>
    );
  }
  if (outcome) {
    return (
      <div className="grid justify-items-start gap-1">
        <StatusChip tone="error" label={productMessages.notCreated} />
        {outcome.message ? (
          <p lang="en" className="max-w-[48ch] type-small text-ink">
            {outcome.message}
          </p>
        ) : null}
      </div>
    );
  }
  if (product.valid) return <StatusChip tone="info" label={productMessages.ready} />;
  return (
    <div className="grid justify-items-start gap-1">
      <StatusChip tone="error" label={productMessages.hasProblems} />
      <IssueList issues={product.errors} messages={messages} />
    </div>
  );
}

/** Rows with a problem, by their line in the file. */
function RowsPart({ rows, messages }: { rows: readonly ImportRow[]; messages: Messages }) {
  const rowMessages = messages.imports.view.rows;
  const rowsWithProblems = rows.filter((row) => !row.valid);
  const columns: Column<ImportRow>[] = [
    {
      key: 'line',
      header: rowMessages.columns.line,
      lead: true,
      cell: (row) => (
        <span className="font-medium tabular-nums text-ink">
          {rowMessages.columns.line} {row.line}
        </span>
      ),
    },
    {
      key: 'ref',
      header: rowMessages.columns.ref,
      cell: (row) => <code className="break-all">{row.productRef}</code>,
    },
    {
      key: 'sku',
      header: rowMessages.columns.sku,
      cell: (row) => <code className="break-all">{row.sku}</code>,
    },
    {
      key: 'problems',
      header: rowMessages.columns.problems,
      cell: (row) => <IssueList issues={row.errors} messages={messages} />,
    },
  ];
  return (
    <section aria-labelledby="import-rows-heading" className="grid gap-3">
      <h2 id="import-rows-heading" className="type-h3 text-ink">
        {rowMessages.title}
      </h2>
      {rowsWithProblems.length === 0 ? (
        <p className="text-ink-2">{rowMessages.none}</p>
      ) : (
        <DataTable
          rows={rowsWithProblems}
          columns={columns}
          rowKey={(row) => String(row.line)}
          caption={rowMessages.title}
        />
      )}
    </section>
  );
}

/** Problems against their column; the backend's words are English. */
function IssueList({ issues, messages }: { issues: readonly ImportIssue[]; messages: Messages }) {
  if (issues.length === 0) return null;
  return (
    <ul className="grid max-w-[56ch] gap-1 type-small text-ink">
      {issues.map((issue) => (
        <li key={`${issue.column ?? ''}-${issue.code}-${issue.message}`}>
          {issue.column ? (
            <code className="font-medium">{issue.column}</code>
          ) : (
            <span className="font-medium">{messages.imports.view.rows.wholeRow}</span>
          )}
          {': '}
          <span lang="en">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}
