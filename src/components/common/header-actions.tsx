'use client';

import { ShoppingBag, UserRound } from 'lucide-react';
import { useCartCount } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';

/**
 * The person's part of the storefront header (Document 5, section 5): "Log in" or the account, and the cart with its
 * number of items. Fetched by the browser after the page loads, so a kept page never holds anything about who is
 * logged in (Document 2, section 5; Document 4, section 7).
 */
export function HeaderActions({ lang }: { lang: Locale }) {
  const t = useMessages();
  const session = useSession();
  const count = useCartCount();
  const user = session.data?.user;
  const link = 'inline-flex h-11 items-center gap-2 rounded-2 px-2 type-label text-ink no-underline transition-colors duration-100 hover:bg-sunken';
  return (
    <>
      <a href={user ? `/${lang}/account` : `/${lang}/login`} className={link}>
        <UserRound aria-hidden="true" className="size-5" />
        <span className="max-sm:sr-only">{user ? t.nav.account : t.nav.logIn}</span>
      </a>
      <a href={`/${lang}/cart`} className={link}>
        <ShoppingBag aria-hidden="true" className="size-5" />
        <span className="max-sm:sr-only">{t.nav.cart}</span>
        {count ? (
          <>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-ink px-1.5 type-caption font-medium text-surface tabular-nums">{count}</span>
            <span className="sr-only">{count === 1 ? t.nav.cartOne : t.nav.cartMany}</span>
          </>
        ) : null}
      </a>
    </>
  );
}
