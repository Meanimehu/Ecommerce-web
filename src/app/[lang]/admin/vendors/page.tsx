import { requireUser } from '@/features/auth/components/require-user';
import { ADMIN_ROLE } from '@/features/auth/types';
import { VendorList } from '@/features/vendor/components/vendor-list';

/** Vendor review list (Document 5, section 8.3): admin only. */
export default async function AdminVendorsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) => user.roles.includes(ADMIN_ROLE));
  if ('render' in result) return result.render;
  return <VendorList lang={result.lang} />;
}
