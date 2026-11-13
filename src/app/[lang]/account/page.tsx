import type { Metadata } from 'next';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteHeader } from '@/components/common/site-header';
import { getMessages } from '@/lib/messages';
import { formatPhone } from '@/utils/format';
import { LogoutButtons } from '@/features/auth/components/logout-buttons';
import { requireUser } from '@/features/auth/components/require-user';
import { isStaff } from '@/features/auth/types';
import { findVendorPresence, VendorPresence } from '@/features/vendor/server/vendor-presence';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, Slice 1 part: the session controls (Document 5, section 6.5, as the approved Stage 5
 * security card) and the areas this person may enter (Document 2, D2-03), and "Become a vendor" for
 * a person with no vendor (D5-10). Profile, addresses and the account tabs come in Slice 3.
 */
export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const result = await requireUser(langParam);
  if ('render' in result) return result.render;
  const { user, lang, token } = result;
  const messages = getMessages(lang);
  // A person with a vendor in any status may open the Vendor area; one with none is offered
  // "Become a vendor" (D5-10). If the backend cannot say, neither link is shown rather than a
  // wrong one.
  const vendorPresence = await findVendorPresence(token);
  const areas = [
    ...(isStaff(user.roles) ? [{ href: `/${lang}/admin`, label: messages.nav.adminArea }] : []),
    ...(vendorPresence === VendorPresence.Exists
      ? [{ href: `/${lang}/vendor`, label: messages.nav.vendorArea }]
      : []),
    ...(vendorPresence === VendorPresence.None
      ? [{ href: `/${lang}/vendor/apply`, label: messages.nav.becomeVendor }]
      : []),
  ];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={messages} />
        <h1 className="type-h1 text-ink">{messages.account.title}</h1>
        <div className="grid max-w-[520px] gap-6">
          <section
            aria-labelledby="phone-heading"
            className="grid gap-1 rounded-1 border border-line bg-surface p-5 sm:p-6"
          >
            <h2 id="phone-heading" className="type-label text-ink">
              {messages.account.phone}
            </h2>
            <p className="text-ink tabular-nums">{formatPhone(user.phone)}</p>
          </section>
          {areas.length ? (
            <nav
              aria-labelledby="areas-heading"
              className="grid gap-2 rounded-1 border border-line bg-surface p-5 sm:p-6"
            >
              <h2 id="areas-heading" className="type-label text-ink">
                {messages.account.areas}
              </h2>
              <ul className="grid">
                {areas.map((area) => (
                  <li key={area.href}>
                    <a
                      className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-madder-hover"
                      href={area.href}
                    >
                      {area.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <LogoutButtons lang={lang} />
        </div>
      </main>
    </>
  );
}
