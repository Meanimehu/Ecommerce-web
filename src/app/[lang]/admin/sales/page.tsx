import { requireUser } from '@/features/auth/components/require-user';
import {
  AdminScreen,
  canCancelSales,
  canReadStockHistory,
  canUseAdminScreen,
} from '@/features/auth/staff-screens';
import { StaffSaleList } from '@/features/sales/components/staff-sale-list';

/**
 * Every vendor's sales (Document 5, section 8.3): admin, moderator, marketing, finance and
 * support; only admins and moderators cancel. What else a row offers follows the person's roles.
 */
export default async function AdminSalesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Sales),
  );
  if ('render' in result) return result.render;
  const { roles } = result.user;
  return (
    <StaffSaleList
      lang={result.lang}
      access={{
        canCancel: canCancelSales(roles),
        canReadStockHistory: canReadStockHistory(roles),
        canOpenVendor: canUseAdminScreen(roles, AdminScreen.Vendors),
      }}
    />
  );
}
