import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { UserPage } from '@/features/users/components/user-page';

/** One person's account and roles (Document 5, section 8.3): admin only. */
export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Users),
  );
  if ('render' in result) return result.render;
  return <UserPage lang={result.lang} id={id} />;
}
