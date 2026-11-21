import { requireUser } from '@/features/auth/components/require-user';
import { canChangeCoupons } from '@/features/auth/staff-screens';
import { NewCouponForm } from '@/features/coupon/components/coupon-form';

/** A new coupon (Document 5, section 8.3): admin and marketing only. */
export default async function NewCouponPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam, (user) => canChangeCoupons(user.roles));
  if ('render' in result) return result.render;
  return <NewCouponForm lang={result.lang} />;
}
