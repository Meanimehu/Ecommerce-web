import { notFound } from 'next/navigation';
import { CatalogueScreen } from '@/features/catalogue/components/catalogue-screen';
import { requireUser } from '@/features/auth/components/require-user';
import { isEditableList } from '@/types/catalogue';

/** One catalogue list (Document 5, section 8.3): admin only. */
export default async function CatalogueListPage({ params }: { params: Promise<{ lang: string; list: string }> }) {
  const { lang: param, list } = await params;
  if (!isEditableList(list)) notFound();
  const result = await requireUser(param, (user) => user.roles.includes('admin'));
  if ('render' in result) return result.render;
  return <CatalogueScreen lang={result.lang} list={list} />;
}
