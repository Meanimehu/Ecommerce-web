import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canChangeCoupons, canUseAdminScreen } from '@/features/auth/staff-screens';
import { StaffCouponList } from '@/features/coupon/components/staff-coupon-list';

/**
 * Every coupon (Document 5, section 8.3): admin, marketing, finance and support; admin and
 * marketing change.
 */
export default async function AdminCouponsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Coupons),
  );
  if ('render' in result) return result.render;
  return <StaffCouponList lang={result.lang} canChange={canChangeCoupons(result.user.roles)} />;
}
