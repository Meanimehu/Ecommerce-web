import { ModerationQueue } from '@/components/admin/moderation-queue';
import { requireUser } from '@/components/auth/require-user';

/** Product moderation queue (Document 5, section 8.3): moderator and admin. */
export default async function ModerationPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, (user) => user.roles.includes('moderator') || user.roles.includes('admin'));
  if ('render' in result) return result.render;
  return <ModerationQueue lang={result.lang} />;
}
