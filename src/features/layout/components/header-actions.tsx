'use client';

import { ShoppingBag, UserRound } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { accountPath, cartPath, loginPath } from '@/lib/routes';
import { useSession } from '@/features/auth/hooks/use-auth';
import { useCartCount } from '@/features/cart/hooks/use-cart';
import { HEADER_LINK_CLASS } from '@/features/layout/header-link';

/**
 * The person's part of the storefront header (Document 5, section 5): "Log in" or the account, and
 * the cart with its number of items. Fetched by the browser after the page loads, so a kept page
 * never holds anything about who is logged in (Document 2, section 5; Document 4, section 7). It
 * shows `auth`'s session and `cart`'s count through their public hooks (Document 7, 20.4).
 */
export function HeaderActions({ lang }: { lang: Locale }) {
  const navMessages = useMessages().nav;
  const session = useSession();
  const cartCount = useCartCount();
  const isLoggedIn = Boolean(session.data?.user);
  return (
    <>
      <a href={isLoggedIn ? accountPath(lang) : loginPath(lang)} className={HEADER_LINK_CLASS}>
        <UserRound aria-hidden="true" className="size-5" />
        <span className="max-sm:sr-only">
          {isLoggedIn ? navMessages.account : navMessages.logIn}
        </span>
      </a>
      <a href={cartPath(lang)} className={HEADER_LINK_CLASS}>
        <ShoppingBag aria-hidden="true" className="size-5" />
        <span className="max-sm:sr-only">{navMessages.cart}</span>
        {cartCount ? (
          <>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-ink px-1.5 type-caption font-medium text-surface tabular-nums">
              {cartCount}
            </span>
            <span className="sr-only">
              {cartCount === 1 ? navMessages.cartOne : navMessages.cartMany}
            </span>
          </>
        ) : null}
      </a>
    </>
  );
}
