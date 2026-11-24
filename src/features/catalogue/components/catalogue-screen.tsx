'use client';

import Link from 'next/link';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { adminCataloguePath } from '@/lib/routes';
import { cn } from '@/utils/cn';
import { formatRate } from '@/utils/format';
import {
  CatalogueList,
  EDITABLE_LISTS,
  inTreeOrder,
  type Brand,
  type Category,
  type Colour,
  type EditableList,
  type GstRate,
  type HsnCode,
  type Size,
} from '@/features/catalogue/types';
import { BrandForm } from './brand-form';
import { CatalogueTable, statusColumn } from './catalogue-table';
import { CategoryForm } from './category-form';
import { ColourForm } from './colour-form';
import { GstRateForm } from './gst-rate-form';
import { HsnCodeForm } from './hsn-code-form';
import { SizeForm } from './size-form';

/**
 * Catalogue lists (Document 5, section 8.3; approved Stage 5): categories, HSN codes, GST rates,
 * brands, sizes and colours, the lists a product needs (Document 8, Slices 2 and 5). One pattern for
 * all, in `catalogue-table.tsx`.
 */

/** How far each level of a sub-category is indented in the table. */
const CATEGORY_INDENT_PX = 20;

export function CatalogueScreen({ lang, list }: { lang: Locale; list: EditableList }) {
  const messages = useMessages();
  const catalogueMessages = messages.catalogue;
  return (
    <div className="grid gap-5">
      <h1 className="type-h2 stitch-bottom pb-3 text-ink">{catalogueMessages.title}</h1>
      <nav aria-label={catalogueMessages.listsLabel} className="overflow-x-auto">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {EDITABLE_LISTS.map((editableList) => (
            <li key={editableList}>
              <Link
                href={adminCataloguePath(lang, editableList)}
                aria-current={editableList === list ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center border-b-[3px] px-3 type-small no-underline transition-colors duration-100 hover:text-ink',
                  editableList === list
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-ink-2',
                )}
              >
                {catalogueMessages.lists[editableList]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {list === CatalogueList.Categories ? <Categories lang={lang} /> : null}
      {list === CatalogueList.HsnCodes ? <HsnCodes lang={lang} /> : null}
      {list === CatalogueList.GstRates ? <GstRates lang={lang} /> : null}
      {list === CatalogueList.Brands ? <Brands lang={lang} /> : null}
      {list === CatalogueList.Sizes ? <Sizes lang={lang} /> : null}
      {list === CatalogueList.Colours ? <Colours lang={lang} /> : null}
    </div>
  );
}

function HsnCodes({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  return (
    <CatalogueTable<HsnCode>
      lang={lang}
      list={CatalogueList.HsnCodes}
      nameOf={(item) => item.code}
      columns={[
        {
          key: 'code',
          header: columnMessages.code,
          lead: true,
          cell: (item) => <span className="font-medium tabular-nums">{item.code}</span>,
        },
        statusColumn(messages),
        {
          key: 'description',
          header: columnMessages.description,
          cell: (item) => item.description,
        },
        {
          key: 'gst',
          header: columnMessages.defaultGst,
          cell: (item) =>
            item.defaultGstRateBps === null ? '—' : formatRate(item.defaultGstRateBps),
        },
      ]}
      form={(item, onDone) => <HsnCodeForm item={item} onDone={onDone} />}
      note={messages.catalogue.codesNeverChange}
    />
  );
}

function GstRates({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  return (
    <CatalogueTable<GstRate>
      lang={lang}
      list={CatalogueList.GstRates}
      searchable={false}
      nameOf={(item) => item.label}
      columns={[
        {
          key: 'rate',
          header: columnMessages.rate,
          lead: true,
          cell: (item) => (
            <span className="font-medium tabular-nums">{formatRate(item.rateBps)}</span>
          ),
        },
        statusColumn(messages),
        { key: 'label', header: columnMessages.label, cell: (item) => item.label },
      ]}
      form={(item, onDone) => <GstRateForm item={item} onDone={onDone} />}
      note={messages.catalogue.ratesNeverChange}
    />
  );
}

function Brands({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  return (
    <CatalogueTable<Brand>
      lang={lang}
      list={CatalogueList.Brands}
      nameOf={(item) => item.name}
      columns={[
        {
          key: 'name',
          header: columnMessages.name,
          lead: true,
          cell: (item) => <span className="font-medium">{item.name}</span>,
        },
        statusColumn(messages),
        { key: 'slug', header: columnMessages.slug, cell: (item) => item.slug },
      ]}
      form={(item, onDone) => <BrandForm item={item} onDone={onDone} />}
    />
  );
}

function Sizes({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  const sizeGroupLabels = messages.catalogue.sizeGroups as Record<string, string>;
  return (
    <CatalogueTable<Size>
      lang={lang}
      list={CatalogueList.Sizes}
      nameOf={(item) => item.code}
      columns={[
        {
          key: 'code',
          header: columnMessages.code,
          lead: true,
          cell: (item) => <span className="font-medium">{item.code}</span>,
        },
        statusColumn(messages),
        { key: 'label', header: columnMessages.label, cell: (item) => item.label },
        {
          key: 'group',
          header: columnMessages.sizeGroup,
          cell: (item) => sizeGroupLabels[item.sizeGroup] ?? item.sizeGroup,
        },
        {
          key: 'order',
          header: columnMessages.sortOrder,
          numeric: true,
          cell: (item) => item.sortOrder,
        },
      ]}
      form={(item, onDone) => <SizeForm item={item} onDone={onDone} />}
      note={messages.catalogue.codesNeverChange}
    />
  );
}

function Colours({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  return (
    <CatalogueTable<Colour>
      lang={lang}
      list={CatalogueList.Colours}
      nameOf={(item) => item.code}
      columns={[
        {
          key: 'code',
          header: columnMessages.code,
          lead: true,
          cell: (item) => (
            <span className="flex items-center gap-2 font-medium">
              {/* The swatch is decoration: the colour's name is written next to it. */}
              <span
                aria-hidden="true"
                className="size-5 rounded-full border border-control"
                style={item.hex ? { background: item.hex } : undefined}
              />
              {item.code}
            </span>
          ),
        },
        statusColumn(messages),
        { key: 'label', header: columnMessages.label, cell: (item) => item.label },
        { key: 'hex', header: columnMessages.hex, cell: (item) => item.hex ?? '—' },
      ]}
      form={(item, onDone) => <ColourForm item={item} onDone={onDone} />}
      note={messages.catalogue.codesNeverChange}
    />
  );
}

/** A category's default tax in one line: its HSN code and GST rate, whichever are set. */
function defaultTaxOf(category: Category): string {
  const rate = category.defaultGstRateBps === null ? null : formatRate(category.defaultGstRateBps);
  return [category.defaultHsnCode, rate].filter(Boolean).join(', ') || '—';
}

function Categories({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const columnMessages = messages.catalogue.columns;
  return (
    <CatalogueTable<Category>
      lang={lang}
      list={CatalogueList.Categories}
      paged={false}
      order={inTreeOrder}
      nameOf={(item) => item.name}
      columns={[
        {
          key: 'name',
          header: columnMessages.name,
          lead: true,
          cell: (item) => (
            <span
              className="font-medium"
              style={{ paddingInlineStart: `${(item.depth - 1) * CATEGORY_INDENT_PX}px` }}
            >
              {item.depth > 1 ? (
                <span aria-hidden="true" className="text-muted-foreground">
                  └{' '}
                </span>
              ) : null}
              {item.name}
            </span>
          ),
        },
        statusColumn(messages),
        { key: 'slug', header: columnMessages.slug, cell: (item) => item.slug },
        {
          key: 'attributes',
          header: columnMessages.attributes,
          numeric: true,
          cell: (item) => item.attributeSchema.length,
        },
        { key: 'tax', header: columnMessages.defaultTax, cell: (item) => defaultTaxOf(item) },
      ]}
      form={(item, onDone) => <CategoryForm item={item} onDone={onDone} />}
      note={messages.catalogue.categoryNote}
    />
  );
}
