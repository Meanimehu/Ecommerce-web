'use client';

import { ScrollText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { DataTable, type Column } from '@/components/common/data-table';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Locale, Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import {
  adminAuditLogPath,
  adminUserPath,
  adminVendorPath,
  moderationProductPath,
} from '@/lib/routes';
import { formatDate, formatTime } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { useAuditLog } from '@/features/audit/hooks/use-audit-log';
import {
  ACTION_MAX_LENGTH,
  AUDIT_ENTITY_TYPES,
  auditQuery,
  badFilters,
  changedNames,
  isAuditEntityType,
  type AuditFilters,
  type AuditRow,
} from '@/features/audit/types';
import { isAnyRole } from '@/features/users/types';

/**
 * The audit log (Document 5, section 8.3; Document 8, Slice 5 notes): who did what, newest first,
 * read only. Filters by action, kind of record, record, the person who did it and a range of days
 * in IST, kept in the address (only those that are set). A filter with the wrong shape is marked
 * under its box and nothing is asked until it is fixed. Each row's changed values open on demand.
 */
const PAGE_SIZE = 20;
const ID_LENGTH = 36;
const FILTER_NAMES = ['action', 'entityType', 'entityId', 'actorId', 'from', 'to'] as const;
const ID_FILTERS = [
  { name: 'entityId', id: 'audit-entity', label: 'entityId' },
  { name: 'actorId', id: 'audit-actor', label: 'actorId' },
] as const;
const DAY_FILTERS = [
  { name: 'from', id: 'audit-from' },
  { name: 'to', id: 'audit-to' },
] as const;

export function AuditLog({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const auditMessages = messages.audit;
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = Object.fromEntries(
    FILTER_NAMES.map((name) => [name, (searchParams.get(name) ?? '').trim()]),
  ) as unknown as AuditFilters;
  const page = pageNumber(searchParams.get('page'));
  const wrong = badFilters(filters);
  const auditLog = useAuditLog(
    { ...auditQuery(filters), page, limit: PAGE_SIZE },
    wrong.length === 0,
  );
  const listPage = adminAuditLogPath(lang);
  const hasFilters = FILTER_NAMES.some((name) => filters[name]);
  const hrefFor = (pageToShow: number) =>
    withQuery(listPage, { ...filters, page: pageToShow === 1 ? undefined : pageToShow });

  /** With scripts, only the filters that are set go into the address; without, the form still works. */
  function showResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = new FormData(event.currentTarget);
    router.push(
      withQuery(
        listPage,
        Object.fromEntries(
          FILTER_NAMES.map((name) => [name, String(chosen.get(name) ?? '').trim()]),
        ),
      ),
    );
  }

  const columns: Column<AuditRow>[] = [
    {
      key: 'when',
      header: auditMessages.columns.when,
      lead: true,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDate(row.createdAt, lang)}, {formatTime(row.createdAt, lang)}
        </span>
      ),
    },
    {
      key: 'action',
      header: auditMessages.columns.action,
      lead: true,
      cell: (row) => <code className="type-small whitespace-nowrap text-ink">{row.action}</code>,
    },
    {
      key: 'who',
      header: auditMessages.columns.who,
      cell: (row) => <WhoCell lang={lang} row={row} messages={messages} />,
    },
    {
      key: 'record',
      header: auditMessages.columns.record,
      cell: (row) => <RecordCell lang={lang} row={row} messages={messages} />,
    },
    {
      key: 'reason',
      header: auditMessages.columns.reason,
      cell: (row) =>
        row.reason ? (
          <span className="whitespace-pre-line">{row.reason}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'changes',
      header: auditMessages.columns.changes,
      cell: (row) => <Changes row={row} messages={messages} />,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 stitch-bottom pb-3">
        <h1 className="type-h2 text-ink">{auditMessages.title}</h1>
        <p className="text-ink-2">{auditMessages.intro}</p>
      </div>
      <form
        method="get"
        action={listPage}
        onSubmit={showResults}
        noValidate
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <FilterBox
          id="audit-action"
          label={auditMessages.filters.action}
          help={auditMessages.filters.actionHelp}
        >
          {(describedBy) => (
            <Input
              id="audit-action"
              name="action"
              defaultValue={filters.action}
              maxLength={ACTION_MAX_LENGTH}
              aria-describedby={describedBy}
            />
          )}
        </FilterBox>
        <FilterBox id="audit-type" label={auditMessages.filters.entityType}>
          {() => (
            <Select
              id="audit-type"
              name="entityType"
              defaultValue={isAuditEntityType(filters.entityType) ? filters.entityType : ''}
            >
              <option value="">{auditMessages.filters.allTypes}</option>
              {AUDIT_ENTITY_TYPES.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {auditMessages.entityTypes[entityType]}
                </option>
              ))}
            </Select>
          )}
        </FilterBox>
        {ID_FILTERS.map(({ name, id, label }) => (
          <FilterBox
            key={name}
            id={id}
            label={auditMessages.filters[label]}
            help={auditMessages.filters.idHelp}
            error={wrong.includes(name) ? auditMessages.filters.badId : undefined}
          >
            {(describedBy) => (
              <Input
                id={id}
                name={name}
                defaultValue={filters[name]}
                maxLength={ID_LENGTH}
                autoComplete="off"
                aria-invalid={wrong.includes(name) || undefined}
                aria-describedby={describedBy}
              />
            )}
          </FilterBox>
        ))}
        {DAY_FILTERS.map(({ name, id }) => (
          <FilterBox
            key={name}
            id={id}
            label={auditMessages.filters[name]}
            error={wrong.includes(name) ? auditMessages.filters.badDay : undefined}
          >
            {(describedBy) => (
              <Input
                id={id}
                type="date"
                name={name}
                defaultValue={filters[name]}
                aria-invalid={wrong.includes(name) || undefined}
                aria-describedby={describedBy}
              />
            )}
          </FilterBox>
        ))}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" variant="secondary">
            {auditMessages.filters.show}
          </Button>
          {hasFilters ? (
            <Button asChild variant="quiet">
              <a href={listPage}>{auditMessages.filters.clear}</a>
            </Button>
          ) : null}
        </div>
      </form>
      {wrong.length > 0 ? (
        <Banner tone="warning" title={auditMessages.fixFilters} />
      ) : (
        <AuditResults auditLog={auditLog} columns={columns} page={page} hrefFor={hrefFor} />
      )}
    </div>
  );
}

/** One filter: its label, its help, and its problem when it has the wrong shape, tied to the box. */
function FilterBox({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
}) {
  const describedBy =
    [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="type-label text-ink">
        {label}
      </label>
      {children(describedBy)}
      {help ? (
        <span id={`${id}-help`} className="type-small text-muted-foreground">
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="type-small text-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** The role someone acted in, in words: a label of the log's own, a role, or the name as the backend wrote it. */
function actorName(role: string | null, messages: Messages): string {
  const auditMessages = messages.audit;
  if (role === null) return auditMessages.system;
  const label = (auditMessages.actorLabels as Record<string, string>)[role];
  if (label) return label;
  return isAnyRole(role) ? messages.users.roleNames[role] : role;
}

/** Who did it: their role at the time and a link to the person, or the system. */
function WhoCell({ lang, row, messages }: { lang: Locale; row: AuditRow; messages: Messages }) {
  const auditMessages = messages.audit;
  const roleName = actorName(row.actorRole, messages);
  if (!row.actorId) return <span>{roleName}</span>;
  return (
    <span className="grid gap-0.5">
      <span>{roleName}</span>
      <a
        href={adminUserPath(lang, row.actorId)}
        className="type-small text-ink-2 underline underline-offset-4"
      >
        {auditMessages.openPerson}
        <span className="sr-only">: {row.actorId}</span>
      </a>
    </span>
  );
}

/** What it was about: the kind of record in words, and a link where an admin screen shows it. */
function RecordCell({ lang, row, messages }: { lang: Locale; row: AuditRow; messages: Messages }) {
  const auditMessages = messages.audit;
  const kind = isAuditEntityType(row.entityType)
    ? auditMessages.entityTypes[row.entityType]
    : row.entityType;
  const href = row.entityId ? recordHref(lang, row.entityType, row.entityId) : null;
  return (
    <span className="grid gap-0.5">
      <span>{kind}</span>
      {row.entityId ? <RecordId id={row.entityId} href={href} /> : null}
    </span>
  );
}

function RecordId({ id, href }: { id: string; href: string | null }) {
  if (!href) return <span className="type-small break-all text-ink-2">{id}</span>;
  return (
    <a href={href} className="type-small break-all text-ink-2 underline underline-offset-4">
      {id}
    </a>
  );
}

/** The admin screens that show a record of this kind. */
function recordHref(lang: Locale, entityType: string, id: string): string | null {
  switch (entityType) {
    case 'user':
      return adminUserPath(lang, id);
    case 'vendor':
      return adminVendorPath(lang, id);
    case 'product':
      return moderationProductPath(lang, id);
    default:
      return null;
  }
}

/** The values that changed, before and after, opened on demand. */
function Changes({ row, messages }: { row: AuditRow; messages: Messages }) {
  const auditMessages = messages.audit;
  const names = changedNames(row);
  if (names.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <details className="max-w-80">
      <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4">
        {auditMessages.showChanges}
      </summary>
      <dl className="grid gap-2 pt-2">
        {names.map((name) => (
          <div key={name} className="grid gap-0.5">
            <dt className="type-small font-medium text-ink">{name}</dt>
            <dd className="type-small break-words text-ink-2">
              {auditMessages.before}: {shown(row.before?.[name])}
              <br />
              {auditMessages.after}: {shown(row.after?.[name])}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** A stored value as text: words as they are, anything else as the backend wrote it. */
function shown(value: unknown): string {
  if (value === undefined || value === null) return '—';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The list itself: loading, failed, empty, or the table with its pages. */
function AuditResults({
  auditLog,
  columns,
  page,
  hrefFor,
}: {
  auditLog: ReturnType<typeof useAuditLog>;
  columns: Column<AuditRow>[];
  page: number;
  hrefFor: (pageToShow: number) => string;
}) {
  const messages = useMessages();
  const auditMessages = messages.audit;
  if (auditLog.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (auditLog.isError) {
    return (
      <PartError
        error={auditLog.error}
        onRetry={() => void auditLog.refetch()}
        messages={messages}
      />
    );
  }
  if (auditLog.data.items.length === 0) {
    return (
      <StateBlock
        icon={ScrollText}
        title={auditMessages.empty}
        text={auditMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return (
    <>
      <DataTable
        rows={auditLog.data.items}
        columns={columns}
        rowKey={(row) => row.id}
        caption={auditMessages.title}
      />
      <Pagination
        page={page}
        limit={auditLog.data.limit}
        total={auditLog.data.total}
        hrefFor={hrefFor}
        messages={messages}
      />
    </>
  );
}
