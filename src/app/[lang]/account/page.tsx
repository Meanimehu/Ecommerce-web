import type { Metadata } from 'next';
import { LogoutButtons } from '@/components/auth/logout-buttons';
import { requireUser } from '@/components/auth/require-user';
import { NeedsScript } from '@/components/common/needs-script';
import { SiteHeader } from '@/components/common/site-header';
import { getMessages } from '@/lib/i18n';
import { isStaff } from '@/types/auth';
import { formatPhone } from '@/utils/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, Slice 1 part: the session controls (Document 5, section 6.5, as the approved Stage 5 security card) and the
 * areas this person may enter (Document 2, D2-03). Profile, addresses and the account tabs come in Slice 3.
 */
export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, `/${param}/account`);
  if ('render' in result) return result.render;
  const { user, lang } = result;
  const t = getMessages(lang);
  const areas = [
    ...(isStaff(user.roles) ? [{ href: `/${lang}/admin`, label: t.nav.adminArea }] : []),
    ...(user.roles.includes('vendor_owner') ? [{ href: `/${lang}/vendor`, label: t.nav.vendorArea }] : []),
  ];
  return (
    <>
      <SiteHeader lang={lang} />
      <main className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <NeedsScript t={t} />
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
