import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canUseAdminScreen } from '@/features/auth/staff-screens';
import { VendorList } from '@/features/vendor/components/vendor-list';

/** Vendor review list (Document 5, section 8.3): admin only. */
export default async function AdminVendorsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Vendors),
  );
  if ('render' in result) return result.render;
  return <VendorList lang={result.lang} />;
}
