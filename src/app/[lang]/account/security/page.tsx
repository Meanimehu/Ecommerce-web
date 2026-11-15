import type { Metadata } from 'next';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { AccountTab, AccountTabs } from '@/features/account/components/account-tabs';
import { LogoutButtons } from '@/features/auth/components/logout-buttons';
import { requireUser } from '@/features/auth/components/require-user';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, the security tab (Document 5, sections 6.5 and 8.1): "Log out", and "Log out
 * everywhere" with a confirmation, from `auth`. Needs login; never indexed.
 */
export default async function SecurityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { lang } = result;
  const messages = getMessages(lang);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={messages} />
        <AccountTabs lang={lang} current={AccountTab.Security} messages={messages.account} />
        <MessagesProvider messages={sectionMessages(lang, ['account'])}>
          <div className="max-w-[640px]">
            <LogoutButtons lang={lang} />
          </div>
        </MessagesProvider>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
