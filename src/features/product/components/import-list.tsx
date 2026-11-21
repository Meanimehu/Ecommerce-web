'use client';

import { FileSpreadsheet, Upload } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BackendErrorCode } from '@/lib/error-codes';
import { fill, messageFor } from '@/lib/errors';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { myImportPath, myImportsPath, myProductsPath } from '@/lib/routes';
import { formatSize, UPLOAD_RULES } from '@/lib/uploads';
import { formatDate, formatTime } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useMyVendor } from '@/features/vendor/hooks/use-vendor';
import { VendorStatus } from '@/features/vendor/types';
import { fileProblemsOf, useImportUpload } from '@/features/product/hooks/use-import-upload';
import {
  importTemplateHref,
  useImportColumns,
  useMyImports,
} from '@/features/product/hooks/use-imports';
import { useDictionaries } from '@/features/product/hooks/use-product';
import {
  flattenCategories,
  importStateOf,
  type ImportColumn,
  type ImportSummary,
} from '@/features/product/types';
import { ImportStateChip } from './import-state-chip';

/**
 * CSV import (Document 5, section 7.3; area-3b-products.md, section 7): the example file for a
 * category or none, with the columns it takes and the limits; an upload, which only checks the file
 * and opens its import; and the vendor's imports, newest first, with the page in the address. Only
 * an approved vendor can upload; the Vendor area's one banner says why to the others. The example
 * file is the only CSV the backend gives (D5-11).
 */
const PAGE_SIZE = 20;

export function ImportList({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const importMessages = messages.imports;
  const myVendor = useMyVendor();
  const isApproved = myVendor.data?.status === VendorStatus.Approved;

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        label={messages.nav.breadcrumbs}
        items={[
          { label: messages.product.title, href: myProductsPath(lang) },
          { label: importMessages.shortTitle },
        ]}
      />
      <div className="grid gap-2 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{importMessages.title}</h1>
        <p className="max-w-[72ch] text-ink-2">{importMessages.intro}</p>
      </div>
      <TemplatePart />
      {isApproved ? <UploadPart lang={lang} /> : null}
      <ImportHistory lang={lang} />
    </div>
  );
}

/** The example file to download, and the columns and limits of the chosen category. */
function TemplatePart() {
  const messages = useMessages();
  const templateMessages = messages.imports.template;
  const [categoryId, setCategoryId] = useState('');
  const dictionaries = useDictionaries();
  const importColumns = useImportColumns(categoryId);
  const categoryChoices = flattenCategories(dictionaries.data?.categories ?? []);
  const selectId = useId();
  const limits = importColumns.data?.limits;

  return (
    <section
      aria-labelledby="import-template-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="import-template-heading" className="type-h3 text-ink">
        {templateMessages.title}
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor={selectId} className="type-label text-ink">
            {templateMessages.category}
          </label>
          <Select
            id={selectId}
            value={categoryId}
            aria-describedby={`${selectId}-help`}
            onChange={(event) => setCategoryId(event.target.value)}
            className="lg:h-10"
          >
            <option value="">{templateMessages.categoryNone}</option>
            {categoryChoices.map(({ category, path }) => (
              <option key={category.id} value={category.id}>
                {path}
              </option>
            ))}
          </Select>
        </div>
        <Button asChild variant="secondary">
          <a href={importTemplateHref(categoryId)} download className="no-underline">
            <FileSpreadsheet aria-hidden="true" />
            {templateMessages.download}
          </a>
        </Button>
      </div>
      <p id={`${selectId}-help`} className="type-small text-ink-2">
        {templateMessages.categoryHelp}
      </p>
      {limits ? (
        <p className="type-small text-ink-2">
          {fill(messages.imports.limits, {
            rows: limits.maxRows,
            size: formatSize(limits.maxBytes),
            variants: limits.maxVariantsPerProduct,
            uploads: limits.uploadsPerHour,
            hours: limits.previewValidHours,
          })}
        </p>
      ) : null}
      <details className="grid gap-3">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-ink underline underline-offset-4">
          {templateMessages.columns}
        </summary>
        <ColumnGuide importColumns={importColumns} messages={messages} />
      </details>
    </section>
  );
}

/** The file's columns, as the backend lists them. Its rules are written in English only. */
function ColumnGuide({
  importColumns,
  messages,
}: {
  importColumns: ReturnType<typeof useImportColumns>;
  messages: Messages;
}) {
  const templateMessages = messages.imports.template;
  if (importColumns.isPending) return <LoadingBlock messages={messages} lines={4} />;
  if (importColumns.isError) {
    return (
      <PartError
        error={importColumns.error}
        onRetry={() => void importColumns.refetch()}
        messages={messages}
      />
    );
  }
  const columns: Column<ImportColumn>[] = [
    {
      key: 'name',
      header: templateMessages.headers.name,
      lead: true,
      cell: (column) => <code className="font-medium text-ink">{column.name}</code>,
    },
    {
      key: 'required',
      header: templateMessages.headers.required,
      cell: (column) => (column.required ? templateMessages.required : templateMessages.optional),
    },
    {
      key: 'level',
      header: templateMessages.headers.level,
      cell: (column) => templateMessages.level[column.level],
    },
    {
      key: 'example',
      header: templateMessages.headers.example,
      cell: (column) => <code className="break-words">{column.example}</code>,
    },
    {
      key: 'rules',
      header: templateMessages.headers.rules,
      cell: (column) => (
        <span lang="en" className="block max-w-[48ch] type-small">
          {column.format}. {column.rules}
        </span>
      ),
    },
  ];
  return (
    <div className="grid gap-2 pt-2">
      <p className="type-small text-ink-2">{templateMessages.englishNote}</p>
      <DataTable
        rows={importColumns.data.columns}
        columns={columns}
        rowKey={(column) => column.name}
        caption={templateMessages.columns}
      />
    </div>
  );
}

/** Choosing a file sends it at once to be checked; a checked file opens its import. */
function UploadPart({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const uploadMessages = messages.imports.upload;
  const importUpload = useImportUpload(lang);
  const { uploadError, progress } = importUpload;
  const fileInput = useRef<HTMLInputElement>(null);
  const fileProblems =
    uploadError?.code === BackendErrorCode.ImportFileInvalid ? fileProblemsOf(uploadError) : [];

  return (
    <section
      aria-labelledby="import-upload-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="import-upload-heading" className="type-h3 text-ink">
        {uploadMessages.title}
      </h2>
      <p id="import-upload-help" className="type-small text-ink-2">
        {fill(uploadMessages.help, { size: formatSize(UPLOAD_RULES.csv.maxBytes) })}
      </p>
      <div>
        <input
          ref={fileInput}
          type="file"
          accept={UPLOAD_RULES.csv.accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) importUpload.uploadFile(file);
          }}
        />
        <Button
          type="button"
          disabled={importUpload.isUploading}
          aria-describedby="import-upload-help"
          onClick={() => fileInput.current?.click()}
        >
          <Upload aria-hidden="true" />
          {uploadMessages.choose}
        </Button>
      </div>
      {progress !== null ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="type-small text-ink-2 tabular-nums">
            {fill(uploadMessages.uploading, { percent: Math.round(progress * 100) })}
          </p>
          <Button type="button" variant="quiet" size="small" onClick={importUpload.cancelUpload}>
            {messages.common.cancel}
          </Button>
        </div>
      ) : null}
      {uploadError ? (
        <ErrorMessage
          text={messageFor(uploadError, messages)}
          requestId={uploadError.requestId}
          messages={messages}
        />
      ) : null}
      {fileProblems.length > 0 ? (
        <div className="grid gap-1">
          <p className="type-small font-medium text-ink">{uploadMessages.fileProblems}</p>
          <ul lang="en" className="grid list-disc gap-1 ps-5 type-small text-ink">
            {fileProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {importUpload.isOutcomeUnknown ? (
        <Banner tone="warning">{uploadMessages.unknown}</Banner>
      ) : null}
    </section>
  );
}

/** The vendor's imports, newest first; each opens its check or its result. */
function ImportHistory({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const historyMessages = messages.imports.history;
  const searchParams = useSearchParams();
  const page = pageNumber(searchParams.get('page'));
  const myImports = useMyImports({ page, limit: PAGE_SIZE });
  const listPath = myImportsPath(lang);

  const columns: Column<ImportSummary>[] = [
    {
      key: 'file',
      header: historyMessages.columns.file,
      lead: true,
      cell: (summary) => (
        <Link
          href={myImportPath(lang, summary.id)}
          className="inline-flex min-h-11 items-center font-medium break-all underline underline-offset-4"
        >
          {summary.fileName}
        </Link>
      ),
    },
    {
      key: 'state',
      header: historyMessages.columns.state,
      lead: true,
      cell: (summary) => <ImportStateChip state={importStateOf(summary)} messages={messages} />,
    },
    {
      key: 'uploaded',
      header: historyMessages.columns.uploaded,
      cell: (summary) => (
        <span className="whitespace-nowrap">
          {formatDate(summary.createdAt, lang)} {formatTime(summary.createdAt, lang)}
        </span>
      ),
    },
    {
      key: 'products',
      header: historyMessages.columns.products,
      numeric: true,
      cell: (summary) =>
        fill(historyMessages.productsReady, {
          valid: summary.totals.validProducts,
          total: summary.totals.products,
        }),
    },
    {
      key: 'created',
      header: historyMessages.columns.created,
      numeric: true,
      cell: (summary) => summary.totals.createdProducts,
    },
  ];

  return (
    <section aria-labelledby="import-history-heading" className="grid gap-4">
      <h2 id="import-history-heading" className="type-h3 text-ink">
        {historyMessages.title}
      </h2>
      <HistoryResults
        myImports={myImports}
        columns={columns}
        page={page}
        hrefFor={(pageToShow) =>
          withQuery(listPath, { page: pageToShow === 1 ? undefined : pageToShow })
        }
        messages={messages}
      />
    </section>
  );
}

function HistoryResults({
  myImports,
  columns,
  page,
  hrefFor,
  messages,
}: {
  myImports: ReturnType<typeof useMyImports>;
  columns: Column<ImportSummary>[];
  page: number;
  hrefFor: (page: number) => string;
  messages: Messages;
}) {
  const historyMessages = messages.imports.history;
  if (myImports.isPending) return <LoadingBlock messages={messages} lines={4} />;
  if (myImports.isError) {
    return (
      <PartError
        error={myImports.error}
        onRetry={() => void myImports.refetch()}
        messages={messages}
      />
    );
  }
  if (myImports.data.items.length === 0) {
    return (
      <StateBlock
        icon={FileSpreadsheet}
        title={historyMessages.empty}
        text={historyMessages.emptyText}
        titleAs="h3"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={myImports.data.items}
        columns={columns}
        rowKey={(summary) => summary.id}
        caption={historyMessages.title}
      />
      <Pagination
        page={page}
        limit={PAGE_SIZE}
        total={myImports.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
