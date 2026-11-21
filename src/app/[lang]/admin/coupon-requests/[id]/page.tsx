import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canChangeCoupons, canUseAdminScreen } from '@/features/auth/staff-screens';
import { StaffRequestPage } from '@/features/coupon/components/staff-request-page';

/** One coupon request (Document 5, section 8.3): read by every coupon role; admin and marketing decide. */
export default async function AdminCouponRequestPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.CouponRequests),
  );
  if ('render' in result) return result.render;
  const { roles, id: viewerId } = result.user;
  return (
    <StaffRequestPage
      lang={result.lang}
      id={id}
      access={{
        canDecide: canChangeCoupons(roles),
        canOpenVendor: canUseAdminScreen(roles, AdminScreen.Vendors),
        canOpenCoupons: canUseAdminScreen(roles, AdminScreen.Coupons),
        viewerId,
      }}
    />
  );
}
