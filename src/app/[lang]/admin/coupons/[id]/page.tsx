import { requireUser } from '@/features/auth/components/require-user';
import { AdminScreen, canChangeCoupons, canUseAdminScreen } from '@/features/auth/staff-screens';
import { StaffCouponPage } from '@/features/coupon/components/staff-coupon-page';

/** One coupon (Document 5, section 8.3): read by every coupon role; changed by admin and marketing. */
export default async function AdminCouponPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) =>
    canUseAdminScreen(user.roles, AdminScreen.Coupons),
  );
  if ('render' in result) return result.render;
  const { roles } = result.user;
  return (
    <StaffCouponPage
      lang={result.lang}
      id={id}
      access={{
        canChange: canChangeCoupons(roles),
        canOpenVendor: canUseAdminScreen(roles, AdminScreen.Vendors),
      }}
    />
  );
}
