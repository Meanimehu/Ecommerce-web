import type { Metadata } from 'next';
import { getMyVendor } from '@/api/vendor';
import { LogoutButtons } from '@/features/auth/components/logout-buttons';
import { requireUser } from '@/features/auth/components/require-user';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteHeader } from '@/components/common/site-header';
import { AppError } from '@/lib/errors';
import { getMessages } from '@/lib/messages';
import { isStaff } from '@/features/auth/types';
import { formatPhone } from '@/utils/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, Slice 1 part: the session controls (Document 5, section 6.5, as the approved Stage 5 security card) and the
 * areas this person may enter (Document 2, D2-03), and "Become a vendor" for a person with no vendor (D5-10). Profile, addresses and the account tabs come in Slice 3.
 */
export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param);
  if ('render' in result) return result.render;
  const { user, lang, token } = result;
  const t = getMessages(lang);
  // A person with a vendor in any status may open the Vendor area; one with none is offered "Become a vendor" (D5-10).
  // If the backend cannot say, neither link is shown rather than a wrong one.
  const vendor = await getMyVendor(token).then(
    () => 'yes' as const,
    (error: unknown) => (error instanceof AppError && error.code === 'VENDOR_NOT_FOUND' ? ('no' as const) : ('unknown' as const)),
  );
  const areas = [
    ...(isStaff(user.roles) ? [{ href: `/${lang}/admin`, label: t.nav.adminArea }] : []),
    ...(vendor === 'yes' ? [{ href: `/${lang}/vendor`, label: t.nav.vendorArea }] : []),
    ...(vendor === 'no' ? [{ href: `/${lang}/vendor/apply`, label: t.nav.becomeVendor }] : []),
  ];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript messages={t} />
        <h1 className="type-h1 text-ink">{t.account.title}</h1>
        <div className="grid max-w-[520px] gap-6">
          <section aria-labelledby="phone-heading" className="grid gap-1 rounded-1 border border-line bg-surface p-5 sm:p-6">
            <h2 id="phone-heading" className="type-label text-ink">
              {t.account.phone}
            </h2>
            <p className="text-ink tabular-nums">{formatPhone(user.phone)}</p>
          </section>
          {areas.length ? (
            <nav aria-labelledby="areas-heading" className="grid gap-2 rounded-1 border border-line bg-surface p-5 sm:p-6">
              <h2 id="areas-heading" className="type-label text-ink">
                {t.account.areas}
              </h2>
              <ul className="grid">
                {areas.map((area) => (
                  <li key={area.href}>
                    <a className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-madder-hover" href={area.href}>
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
