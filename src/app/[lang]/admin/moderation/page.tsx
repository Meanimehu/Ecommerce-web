import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { ModerationQueue } from '@/features/product/components/moderation-queue';

/** Product moderation queue (Document 5, section 8.3): moderator and admin. */
export default async function ModerationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Moderation),
  );
  if ('render' in result) return result.render;
  return <ModerationQueue lang={result.lang} />;
}
