import Link from 'next/link';
import type { Locale, Messages } from '@/lib/i18n';
import { myCouponRequestsPath, myCouponsPath } from '@/lib/routes';
import { cn } from '@/utils/cn';

/** Which of the vendor's two coupon screens is open. */
export enum CouponTab {
  Coupons = 'coupons',
  Requests = 'requests',
}

/**
 * The two tabs of the vendor's Coupons (Document 8, held items, menus): the coupons that charge the
 * vendor, and the vendor's coupon requests. Each is its own page, so a tab is a link and the
 * address says which is open.
 */
export function CouponTabs({
  lang,
  current,
  messages,
}: {
  lang: Locale;
  current: CouponTab;
  messages: Messages;
}) {
  const requestMessages = messages.coupon.requests;
  const tabs = [
    { tab: CouponTab.Coupons, href: myCouponsPath(lang), label: requestMessages.tabs.coupons },
    {
      tab: CouponTab.Requests,
      href: myCouponRequestsPath(lang),
      label: requestMessages.tabs.requests,
    },
  ];
  return (
    <nav aria-label={requestMessages.tabsLabel} className="stitch-bottom">
      <ul className="flex flex-wrap gap-1">
        {tabs.map(({ tab, href, label }) => {
          const isCurrent = tab === current;
          return (
            <li key={tab}>
              <Link
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center border-b-2 px-3 font-medium no-underline',
                  isCurrent
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink-2 hover:text-ink',
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
