import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { ModerationReview } from '@/features/product/components/moderation-review';

/**
 * One product for review (Document 5, section 8.3): moderator and admin, never for the person's
 * own vendor.
 */
export default async function ModerationReviewPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Moderation),
  );
  if ('render' in result) return result.render;
  return <ModerationReview lang={result.lang} id={id} />;
}
