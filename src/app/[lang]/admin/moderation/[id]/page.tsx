import { ModerationReview } from '@/components/admin/moderation-review';
import { requireUser } from '@/components/auth/require-user';

/** One product for review (Document 5, section 8.3): moderator and admin, never for the person's own vendor. */
export default async function ModerationReviewPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: param, id } = await params;
  const result = await requireUser(param, (user) => user.roles.includes('moderator') || user.roles.includes('admin'));
  if ('render' in result) return result.render;
  return <ModerationReview lang={result.lang} id={id} />;
}
