'use client';

import { Tags } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { StatusChip } from '@/components/common/status-chip';
import { useToast } from '@/components/common/toast';
import { useCatalogueList, useSaveCatalogueItem } from '@/features/catalogue/hooks/use-catalogue';
import { fill, messageFor, toAppError } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { EDITABLE_LISTS, inTreeOrder, type Brand, type Category, type Colour, type EditableList, type HsnCode, type Size } from '@/features/catalogue/types';
import { cn } from '@/utils/cn';
import { formatRate } from '@/utils/format';
import { pageNumber, withQuery } from '@/utils/url';
import { BrandForm, ColourForm, HsnForm, SizeForm } from './catalogue-forms';
import { CategoryForm } from './category-form';

/**
 * Catalogue lists (Document 5, section 8.3; approved Stage 5): categories, HSN codes, brands, sizes and colours, the
 * lists a product needs (Document 8, Slice 2). One pattern for all: a table with its status, Edit, and Switch off or on
 * (nothing is ever deleted, and codes never change: area-3a-catalogue.md, "Rules for the admin lists"); "Add" opens the
 * form above the table. GST rates are only offered as choices here; their own screen comes in Slice 5.
 */
interface Item {
  id: string;
  isActive: boolean;
}

export function CatalogueScreen({ lang, list }: { lang: Locale; list: EditableList }) {
  const t = useMessages();
  const c = t.catalogue;
  const base = `/${lang}/admin/catalogue`;
  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{c.title}</h1>
      <nav aria-label={c.listsLabel} className="overflow-x-auto">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {EDITABLE_LISTS.map((name) => (
            <li key={name}>
              <Link
                href={`${base}/${name}`}
                aria-current={name === list ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center border-b-[3px] px-3 type-small no-underline transition-colors duration-100 hover:text-ink',
                  name === list ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-2',
                )}
              >
                {c.lists[name]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {list === 'categories' ? <Categories lang={lang} /> : null}
      {list === 'hsn-codes' ? <HsnCodes lang={lang} /> : null}
      {list === 'brands' ? <Brands lang={lang} /> : null}
      {list === 'sizes' ? <Sizes lang={lang} /> : null}
      {list === 'colours' ? <Colours lang={lang} /> : null}
    </div>
  );
}

function statusColumn<T extends Item>(t: Messages): Column<T> {
  return {
    key: 'status',
    header: t.catalogue.columns.status,
    lead: true,
    cell: (item) => (item.isActive ? <StatusChip tone="success" label={t.catalogue.active} /> : <StatusChip tone="neutral" label={t.catalogue.switchedOff} />),
  };
}

function HsnCodes({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.catalogue.columns;
  return (
    <CatalogueTable<HsnCode>
      lang={lang}
      list="hsn-codes"
      nameOf={(item) => item.code}
      columns={[
        { key: 'code', header: c.code, lead: true, cell: (item) => <span className="font-medium tabular-nums">{item.code}</span> },
        statusColumn(t),
        { key: 'description', header: c.description, cell: (item) => item.description },
        { key: 'gst', header: c.defaultGst, cell: (item) => (item.defaultGstRateBps === null ? '—' : formatRate(item.defaultGstRateBps)) },
      ]}
      form={(item, done) => <HsnForm item={item} onDone={done} />}
      note={t.catalogue.codesNeverChange}
    />
  );
}

function Brands({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.catalogue.columns;
  return (
    <CatalogueTable<Brand>
      lang={lang}
      list="brands"
      nameOf={(item) => item.name}
      columns={[
        { key: 'name', header: c.name, lead: true, cell: (item) => <span className="font-medium">{item.name}</span> },
        statusColumn(t),
        { key: 'slug', header: c.slug, cell: (item) => item.slug },
      ]}
      form={(item, done) => <BrandForm item={item} onDone={done} />}
    />
  );
}

function Sizes({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.catalogue.columns;
  return (
    <CatalogueTable<Size>
      lang={lang}
      list="sizes"
      nameOf={(item) => item.code}
      columns={[
        { key: 'code', header: c.code, lead: true, cell: (item) => <span className="font-medium">{item.code}</span> },
        statusColumn(t),
        { key: 'label', header: c.label, cell: (item) => item.label },
        { key: 'group', header: c.sizeGroup, cell: (item) => (t.catalogue.sizeGroups as Record<string, string>)[item.sizeGroup] ?? item.sizeGroup },
        { key: 'order', header: c.sortOrder, numeric: true, cell: (item) => item.sortOrder },
      ]}
      form={(item, done) => <SizeForm item={item} onDone={done} />}
      note={t.catalogue.codesNeverChange}
    />
  );
}

function Colours({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.catalogue.columns;
  return (
    <CatalogueTable<Colour>
      lang={lang}
      list="colours"
      nameOf={(item) => item.code}
      columns={[
        {
          key: 'code',
          header: c.code,
          lead: true,
          cell: (item) => (
            <span className="flex items-center gap-2 font-medium">
              {/* The swatch is decoration: the colour's name is written next to it. */}
              <span aria-hidden="true" className="size-5 rounded-full border border-control" style={item.hex ? { background: item.hex } : undefined} />
              {item.code}
            </span>
          ),
        },
        statusColumn(t),
        { key: 'label', header: c.label, cell: (item) => item.label },
        { key: 'hex', header: c.hex, cell: (item) => item.hex ?? '—' },
      ]}
      form={(item, done) => <ColourForm item={item} onDone={done} />}
      note={t.catalogue.codesNeverChange}
    />
  );
}

function Categories({ lang }: { lang: Locale }) {
  const t = useMessages();
  const c = t.catalogue.columns;
  return (
    <CatalogueTable<Category>
      lang={lang}
      list="categories"
      paged={false}
      order={inTreeOrder}
      nameOf={(item) => item.name}
      columns={[
        {
          key: 'name',
          header: c.name,
          lead: true,
          cell: (item) => (
            <span className="font-medium" style={{ paddingInlineStart: `${(item.depth - 1) * 20}px` }}>
              {item.depth > 1 ? <span aria-hidden="true" className="text-muted-foreground">└ </span> : null}
              {item.name}
            </span>
          ),
        },
        statusColumn(t),
        { key: 'slug', header: c.slug, cell: (item) => item.slug },
        { key: 'attributes', header: c.attributes, numeric: true, cell: (item) => item.attributeSchema.length },
        { key: 'tax', header: c.defaultTax, cell: (item) => [item.defaultHsnCode, item.defaultGstRateBps === null ? null : formatRate(item.defaultGstRateBps)].filter(Boolean).join(', ') || '—' },
      ]}
      form={(item, done) => <CategoryForm item={item} onDone={done} />}
      note={t.catalogue.categoryNote}
    />
  );
}

const LIMIT = 20;

function CatalogueTable<T extends Item>({
  lang,
  list,
  columns,
  nameOf,
  form,
  note,
  paged = true,
  order,
}: {
  lang: Locale;
  list: EditableList;
  columns: Column<T>[];
  nameOf: (item: T) => string;
  form: (item: T | undefined, done: () => void) => ReactNode;
  note?: string;
  paged?: boolean;
  /** The order to show rows in, when it is not the backend's. */
  order?: (items: T[]) => T[];
}) {
  const t = useMessages();
  const c = t.catalogue;
  const toast = useToast();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const isActive = params.get('isActive') ?? '';
  const page = pageNumber(params.get('page'));
  const query = paged ? { q, isActive, page, limit: LIMIT } : {};
  const data = useCatalogueList<T>(list, query);
  const save = useSaveCatalogueItem(list);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const base = `/${lang}/admin/catalogue/${list}`;

  useEffect(() => {
    if (editing) panel.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [editing]);

  const actions: Column<T> = {
    key: 'actions',
    header: c.columns.actions,
    cell: (item) => (
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" size="small" onClick={() => setEditing(item)}>
          {c.edit}
          <span className="sr-only">: {nameOf(item)}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(
              { id: item.id, body: { isActive: !item.isActive } },
              { onSuccess: () => toast(fill(item.isActive ? c.switchedOffDone : c.switchedOnDone, { name: nameOf(item) })) },
            )
          }
        >
          {item.isActive ? c.switchOff : c.switchOn}
          <span className="sr-only">: {nameOf(item)}</span>
        </Button>
      </div>
    ),
  };

  const loaded = data.data?.items ?? [];
  const items = order ? order(loaded) : loaded;
  const total = data.data && 'total' in data.data ? data.data.total : items.length;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {paged ? (
          <form method="get" action={base} className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5">
              <span className="type-label text-ink">{c.filters.status}</span>
              <Select name="isActive" defaultValue={isActive} className="lg:h-10">
                <option value="">{c.filters.all}</option>
                <option value="true">{c.active}</option>
                <option value="false">{c.switchedOff}</option>
              </Select>
            </label>
            <label className="grid gap-1.5">
              <span className="type-label text-ink">{c.filters.search}</span>
              <Input type="search" name="q" defaultValue={q} maxLength={100} className="lg:h-10" />
            </label>
            <Button type="submit" variant="secondary">
              {c.filters.show}
            </Button>
          </form>
        ) : (
          <span />
        )}
        {editing === null ? (
          <Button type="button" onClick={() => setEditing('new')}>
            {c.add[list]}
          </Button>
        ) : null}
      </div>

      {editing !== null ? (
        <div ref={panel}>{form(editing === 'new' ? undefined : editing, () => setEditing(null))}</div>
      ) : null}

      {save.error ? <ErrorMessage text={messageFor(toAppError(save.error), t)} requestId={toAppError(save.error).requestId} messages={t} /> : null}

      {data.isPending ? (
        <LoadingBlock messages={t} lines={6} />
      ) : data.isError ? (
        <PartError error={data.error} onRetry={() => void data.refetch()} messages={t} />
      ) : items.length === 0 ? (
        <StateBlock icon={Tags} title={c.empty} text={q || isActive ? c.emptyFiltered : c.emptyText} titleAs="h2" />
      ) : (
        <>
          <DataTable rows={items} columns={[...columns, actions]} rowKey={(item) => item.id} caption={c.lists[list]} />
          {paged ? <Pagination page={page} limit={LIMIT} total={total} hrefFor={(n) => withQuery(base, { q, isActive, page: n === 1 ? undefined : n })} messages={t} /> : null}
        </>
      )}
      {note ? (
        <Banner tone="info">{note}</Banner>
      ) : null}
    </div>
  );
}
