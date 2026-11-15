import type { Metadata } from 'next';
import { requireUser } from '@/features/auth/components/require-user';
import { CartScreen } from '@/features/cart/components/cart-screen';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';

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
        {/* The cart's text is carried only by this page (lib/messages.ts). */}
        <MessagesProvider messages={sectionMessages(lang, ['cart'])}>
          <CartScreen lang={lang} />
        </MessagesProvider>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
