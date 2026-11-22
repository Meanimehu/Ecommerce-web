import { requireUser } from '@/features/auth/components/require-user';
import { canChangeCoupons } from '@/features/auth/staff-screens';
import { ChangeCouponForm } from '@/features/coupon/components/coupon-form';

/** A change to a coupon's terms (Document 5, section 8.3): admin and marketing only. */
export default async function ChangeCouponPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: langParam, id } = await params;
  const result = await requireUser(langParam, (user) => canChangeCoupons(user.roles));
  if ('render' in result) return result.render;
  return <ChangeCouponForm lang={result.lang} id={id} />;
}
