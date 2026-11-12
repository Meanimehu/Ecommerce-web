import { redirect } from 'next/navigation';

/** Catalogue lists open on categories, the first list a product needs. */
export default async function CataloguePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/admin/catalogue/categories`);
}
