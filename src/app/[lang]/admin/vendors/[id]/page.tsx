import { requireUser } from '@/features/auth/components/require-user';
import { ADMIN_ROLE } from '@/features/auth/types';
import { VendorReview } from '@/features/vendor/components/vendor-review';

/** One vendor application for review (Document 5, section 8.3): admin only. */
export default async function AdminVendorPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) => user.roles.includes(ADMIN_ROLE));
  if ('render' in result) return result.render;
  return <VendorReview lang={result.lang} id={id} />;
}
