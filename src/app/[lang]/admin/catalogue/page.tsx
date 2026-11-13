import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { adminCataloguePath } from '@/lib/routes';
import { CatalogueList } from '@/features/catalogue/types';

/** Catalogue lists open on categories, the first list a product needs. */
export default async function CataloguePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  redirect(adminCataloguePath(lang, CatalogueList.Categories));
}
