import { requireUser } from '@/features/auth/components/require-user';
import { isStaff } from '@/features/auth/types';
import { AdminHome } from '@/features/layout/components/admin-home';

/** Admin home: any staff role (Document 5, section 8.3). The links come from `layout`. */
export default async function AdminHomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) => isStaff(user.roles));
  if ('render' in result) return result.render;
  return <AdminHome lang={result.lang} roles={result.user.roles} />;
}
