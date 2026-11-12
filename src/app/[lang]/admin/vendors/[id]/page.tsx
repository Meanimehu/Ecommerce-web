import { requireUser } from '@/features/auth/components/require-user';
import { VendorReview } from '@/components/admin/vendor-review';

/** One vendor application for review (Document 5, section 8.3): admin only. */
export default async function AdminVendorPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: param, id } = await params;
  const result = await requireUser(param, (user) => user.roles.includes('admin'));
  if ('render' in result) return result.render;
  return <VendorReview lang={result.lang} id={id} />;
}
