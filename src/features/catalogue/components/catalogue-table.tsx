'use client';

import { Tags } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DataTable, type Column } from '@/components/common/data-table';
import { ErrorMessage } from '@/components/common/error-message';
import { LoadingBlock, PartError } from '@/components/common/load-states';
import { Pagination } from '@/components/common/pagination';
import { StateBlock } from '@/components/common/state-block';
import { StatusChip } from '@/components/common/status-chip';
import { useToast } from '@/components/common/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fill, messageFor } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCataloguePath } from '@/lib/routes';
import { pageNumber, withQuery } from '@/utils/url';
import { useCatalogueList, useChangeCatalogueItem } from '@/features/catalogue/hooks/use-catalogue';
import type { EditableList } from '@/features/catalogue/types';

/**
 * One catalogue list (Document 5, section 8.3): a table with each entry's status, Edit, and Switch
 * off or on (nothing is ever deleted, and codes never change: area-3a-catalogue.md, "Rules for the
 * admin lists"); "Add" opens the form above the table, and its heading takes focus.
 */
const PAGE_SIZE = 20;

interface CatalogueItem {
  id: string;
  isActive: boolean;
}

export function statusColumn<Item extends CatalogueItem>(messages: Messages): Column<Item> {
  return {
    key: 'status',
    header: messages.catalogue.columns.status,
    lead: true,
    cell: (item) =>
      item.isActive ? (
        <StatusChip tone="success" label={messages.catalogue.active} />
      ) : (
        <StatusChip tone="neutral" label={messages.catalogue.switchedOff} />
      ),
  };
}

export function CatalogueTable<Item extends CatalogueItem>({
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
  columns: Column<Item>[];
  nameOf: (item: Item) => string;
  form: (item: Item | undefined, onDone: () => void) => ReactNode;
  note?: string;
  paged?: boolean;
  /** The order to show rows in, when it is not the backend's. */
  order?: (items: Item[]) => Item[];
}) {
  const messages = useMessages();
  const catalogueMessages = messages.catalogue;
  const toast = useToast();
  const searchParams = useSearchParams();
  const searchText = searchParams.get('q') ?? '';
  const isActive = searchParams.get('isActive') ?? '';
  const page = pageNumber(searchParams.get('page'));
  const query = paged ? { q: searchText, isActive, page, limit: PAGE_SIZE } : {};
  const catalogueList = useCatalogueList<Item>(list, query);
  const changeCatalogueItem = useChangeCatalogueItem(list);
  // One form at a time: a new entry, or the one being changed.
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const isFormOpen = isAdding || editingItem !== null;
  const formPanel = useRef<HTMLDivElement>(null);
  const listPage = adminCataloguePath(lang, list);
  const switchError = changeCatalogueItem.error;

  useEffect(() => {
    if (isFormOpen) formPanel.current?.querySelector<HTMLElement>('h2')?.focus();
  }, [isFormOpen, editingItem]);

  function startEditing(item: Item) {
    setIsAdding(false);
    setEditingItem(item);
  }

  function closeForm() {
    setIsAdding(false);
    setEditingItem(null);
  }

  function switchItem(item: Item) {
    const doneMessage = item.isActive
      ? catalogueMessages.switchedOffDone
      : catalogueMessages.switchedOnDone;
    changeCatalogueItem.mutate(
      { id: item.id, body: { isActive: !item.isActive } },
      { onSuccess: () => toast(fill(doneMessage, { name: nameOf(item) })) },
    );
  }

  const actions: Column<Item> = {
    key: 'actions',
    header: catalogueMessages.columns.actions,
    cell: (item) => (
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" size="small" onClick={() => startEditing(item)}>
          {catalogueMessages.edit}
          <span className="sr-only">: {nameOf(item)}</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={changeCatalogueItem.isPending}
          onClick={() => switchItem(item)}
        >
          {item.isActive ? catalogueMessages.switchOff : catalogueMessages.switchOn}
          <span className="sr-only">: {nameOf(item)}</span>
        </Button>
      </div>
    ),
  };

  const loadedItems = catalogueList.data?.items ?? [];
  const items = order ? order(loadedItems) : loadedItems;
  const total =
    catalogueList.data && 'total' in catalogueList.data ? catalogueList.data.total : items.length;
  const hrefFor = (pageToShow: number) =>
    withQuery(listPage, {
      q: searchText,
      isActive,
      page: pageToShow === 1 ? undefined : pageToShow,
    });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {paged ? (
          <form method="get" action={listPage} className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5">
              <span className="type-label text-ink">{catalogueMessages.filters.status}</span>
              <Select name="isActive" defaultValue={isActive} className="lg:h-10">
                <option value="">{catalogueMessages.filters.all}</option>
                <option value="true">{catalogueMessages.active}</option>
                <option value="false">{catalogueMessages.switchedOff}</option>
              </Select>
            </label>
            <label className="grid gap-1.5">
              <span className="type-label text-ink">{catalogueMessages.filters.search}</span>
              <Input
                type="search"
                name="q"
                defaultValue={searchText}
                maxLength={100}
                className="lg:h-10"
              />
            </label>
            <Button type="submit" variant="secondary">
              {catalogueMessages.filters.show}
            </Button>
          </form>
        ) : (
          <span />
        )}
        {isFormOpen ? null : (
          <Button type="button" onClick={() => setIsAdding(true)}>
            {catalogueMessages.add[list]}
          </Button>
        )}
      </div>

      {isFormOpen ? <div ref={formPanel}>{form(editingItem ?? undefined, closeForm)}</div> : null}

      {switchError ? (
        <ErrorMessage
          text={messageFor(switchError, messages)}
          requestId={switchError.requestId}
          messages={messages}
        />
      ) : null}

      <CatalogueTableResults
        catalogueList={catalogueList}
        items={items}
        columns={[...columns, actions]}
        caption={catalogueMessages.lists[list]}
        isFiltered={Boolean(searchText || isActive)}
      />
      {paged && items.length > 0 && !catalogueList.isPending && !catalogueList.isError ? (
        <Pagination
          page={page}
          limit={PAGE_SIZE}
          total={total}
          hrefFor={hrefFor}
          messages={messages}
        />
      ) : null}
      {note ? <Banner tone="info">{note}</Banner> : null}
    </div>
  );
}

function CatalogueTableResults<Item extends CatalogueItem>({
  catalogueList,
  items,
  columns,
  caption,
  isFiltered,
}: {
  catalogueList: ReturnType<typeof useCatalogueList<Item>>;
  items: Item[];
  columns: Column<Item>[];
  caption: string;
  isFiltered: boolean;
}) {
  const messages = useMessages();
  const catalogueMessages = messages.catalogue;

  if (catalogueList.isPending) return <LoadingBlock messages={messages} lines={6} />;
  if (catalogueList.isError) {
    return (
      <PartError
        error={catalogueList.error}
        onRetry={() => void catalogueList.refetch()}
        messages={messages}
      />
    );
  }
  if (items.length === 0) {
    return (
      <StateBlock
        icon={Tags}
        title={catalogueMessages.empty}
        text={isFiltered ? catalogueMessages.emptyFiltered : catalogueMessages.emptyText}
        titleAs="h2"
      />
    );
  }
  return <DataTable rows={items} columns={columns} rowKey={(item) => item.id} caption={caption} />;
}
