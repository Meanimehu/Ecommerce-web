import type { Metadata } from 'next';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { AccountTab, AccountTabs } from '@/features/account/components/account-tabs';
import { AddressList } from '@/features/account/components/address-list';
import * as accountApi from '@/features/account/server/account-api';
import { requireUser } from '@/features/auth/components/require-user';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, the addresses tab (Document 5, sections 6.5 and 8.1): the saved addresses, default
 * first, read on the server, then added, changed, deleted and made default in the page. Needs
 * login; never indexed.
 */
export default async function AddressesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { lang, token } = result;
  const messages = getMessages(lang);
  const addresses = (await accountApi.listAddresses(token)).data;
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={messages} />
        <AccountTabs lang={lang} current={AccountTab.Addresses} messages={messages.account} />
        <MessagesProvider messages={sectionMessages(lang, ['account'])}>
          <AddressList drawn={addresses} />
        </MessagesProvider>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
