import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { UserList } from '@/features/users/components/user-list';

/** Users and roles (Document 5, section 8.3): admin only. */
export default async function AdminUsersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Users),
  );
  if ('render' in result) return result.render;
  return <UserList lang={result.lang} />;
}
