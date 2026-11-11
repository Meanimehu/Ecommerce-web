import { requireUser } from '@/components/auth/require-user';
import { VendorList } from '@/components/admin/vendor-list';

/** Vendor review list (Document 5, section 8.3): admin only. */
export default async function AdminVendorsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, (user) => user.roles.includes('admin'));
  if ('render' in result) return result.render;
  return <VendorList lang={result.lang} />;
}
