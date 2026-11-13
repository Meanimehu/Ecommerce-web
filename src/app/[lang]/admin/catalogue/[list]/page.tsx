import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/components/require-user';
import { ADMIN_ROLE } from '@/features/auth/types';
import { CatalogueScreen } from '@/features/catalogue/components/catalogue-screen';
import { isEditableList } from '@/features/catalogue/types';

/** One catalogue list (Document 5, section 8.3): admin only. */
export default async function CatalogueListPage({
  params,
}: {
  params: Promise<{ lang: string; list: string }>;
}) {
  const { lang: langParam, list } = await params;
  if (!isEditableList(list)) notFound();
  const result = await requireUser(langParam, (user) => user.roles.includes(ADMIN_ROLE));
  if ('render' in result) return result.render;
  return <CatalogueScreen lang={result.lang} list={list} />;
}
