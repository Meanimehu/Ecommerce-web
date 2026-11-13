import { requireUser } from '@/features/auth/components/require-user';
import { ModerationReview } from '@/features/product/components/moderation-review';
import { canReviewProducts } from '@/features/product/types';

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
  const result = await requireUser(langParam, (user) => canReviewProducts(user.roles));
  if ('render' in result) return result.render;
  return <ModerationReview lang={result.lang} id={id} />;
}
