import { requireUser } from '@/features/auth/components/require-user';
import { canReadStockHistory } from '@/features/auth/staff-screens';
import { StaffStockHistory } from '@/features/stock/components/staff-stock-history';

/**
 * Any variant's stock history (Document 5, section 8.3): admin, moderator and support, read only.
 * No menu entry: reached by links from Sales and Moderation (Document 8, Slice 5 notes).
 */
export default async function StaffStockHistoryPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) => canReadStockHistory(user.roles));
  if ('render' in result) return result.render;
  return <StaffStockHistory lang={result.lang} variantId={id} />;
}
