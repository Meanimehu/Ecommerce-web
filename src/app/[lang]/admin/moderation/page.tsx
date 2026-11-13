import { requireUser } from '@/features/auth/components/require-user';
import { ModerationQueue } from '@/features/product/components/moderation-queue';
import { canReviewProducts } from '@/features/product/types';

/** Product moderation queue (Document 5, section 8.3): moderator and admin. */
export default async function ModerationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) => canReviewProducts(user.roles));
  if ('render' in result) return result.render;
  return <ModerationQueue lang={result.lang} />;
}
