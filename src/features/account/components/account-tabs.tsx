import type { Locale, Messages } from '@/lib/i18n';
import { accountAddressesPath, accountPath, accountSecurityPath } from '@/lib/routes';

/** The account's pages, in the order of the tabs. */
export enum AccountTab {
  Profile = 'profile',
  Addresses = 'addresses',
  Security = 'security',
}

/**
 * The account's heading and its tabs (approved Stage 5 screens; Document 5, 8.1): Profile,
 * Addresses and Security, each its own page; the current one is marked. On a narrow screen the tabs
 * scroll inside their own row.
 */
export function AccountTabs({
  lang,
  current,
  messages,
}: {
  lang: Locale;
  current: AccountTab;
  messages: Messages['account'];
}) {
  const tabs = [
    { tab: AccountTab.Profile, label: messages.profile, href: accountPath(lang) },
    { tab: AccountTab.Addresses, label: messages.addresses, href: accountAddressesPath(lang) },
    { tab: AccountTab.Security, label: messages.security, href: accountSecurityPath(lang) },
  ];
  return (
    <div className="grid gap-4">
      <h1 className="type-h1 text-ink">{messages.title}</h1>
      <nav aria-label={messages.tabs} className="overflow-x-auto border-b border-line">
        <ul className="flex gap-1">
          {tabs.map(({ tab, label, href }) => (
            <li key={tab}>
              <a
                href={href}
                aria-current={tab === current ? 'page' : undefined}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 type-label whitespace-nowrap text-ink-2 no-underline hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
