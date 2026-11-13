import type { Metadata } from 'next';
import { requireUser } from '@/features/auth/components/require-user';
import { CartScreen } from '@/components/cart/cart-screen';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteHeader } from '@/components/common/site-header';
import { getMessages } from '@/lib/messages';

/** The cart (Document 5, section 6.3): it belongs to a logged-in person, so someone not logged in goes to login and comes back. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param);
  if ('render' in result) return result.render;
  const { lang } = result;
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={getMessages(lang)} />
        <CartScreen lang={lang} />
      </main>
    </>
  );
}
