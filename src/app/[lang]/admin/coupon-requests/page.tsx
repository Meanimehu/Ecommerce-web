import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canChangeCoupons, canUseAdminScreen } from '@/features/auth/staff-screens';
import { StaffRequestList } from '@/features/coupon/components/staff-request-list';

/**
 * Every vendor's coupon requests (Document 5, section 8.3): admin, marketing, finance and support;
 * admin and marketing decide.
 */
export default async function AdminCouponRequestsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.CouponRequests),
  );
  if ('render' in result) return result.render;
  return <StaffRequestList lang={result.lang} canDecide={canChangeCoupons(result.user.roles)} />;
}
