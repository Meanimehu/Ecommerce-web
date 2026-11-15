import type { Metadata } from 'next';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteFooter } from '@/features/layout/components/site-footer';
import { SiteHeader } from '@/features/layout/components/site-header';
import { getMessages, sectionMessages } from '@/lib/messages';
import { MessagesProvider } from '@/lib/messages-context';
import { AccountAreas } from '@/features/account/components/account-areas';
import { AccountTab, AccountTabs } from '@/features/account/components/account-tabs';
import { ProfileForm } from '@/features/account/components/profile-form';
import { requireUser } from '@/features/auth/components/require-user';
import { isStaff } from '@/features/auth/types';
import { findVendorPresence } from '@/features/vendor/server/vendor-presence';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, the profile tab (Document 5, sections 6.5 and 8.1): the mobile number, the name and
 * email (both optional, D5-04), and the areas this person may enter, with "Become a vendor" for a
 * person with no vendor (D5-10). Needs login; never indexed.
 */
export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { user, lang, token } = result;
  const messages = getMessages(lang);
  const vendorPresence = await findVendorPresence(token);
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={messages} />
        <AccountTabs lang={lang} current={AccountTab.Profile} messages={messages.account} />
        <MessagesProvider messages={sectionMessages(lang, ['account'])}>
          <ProfileForm user={user} />
        </MessagesProvider>
        <AccountAreas
          lang={lang}
          isStaff={isStaff(user.roles)}
          vendorPresence={vendorPresence}
          messages={messages}
        />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
