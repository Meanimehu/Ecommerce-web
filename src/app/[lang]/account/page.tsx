import type { Metadata } from 'next';
import { LogoutButtons } from '@/components/auth/logout-buttons';
import { requireUser } from '@/components/auth/require-user';
import { LanguageSwitch } from '@/components/common/language-switch';
import { NeedsScript } from '@/components/common/needs-script';
import { getMessages } from '@/lib/i18n';
import { formatPhone } from '@/utils/format';
import { isStaff } from '@/types/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Account, Slice 1 part: the session controls (Document 5, section 6.5) and the areas this person may enter
 * (Document 2, D2-03). Profile and addresses come in Slice 3.
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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <a href={`/${lang}`} className="text-xl font-semibold">
          {t.site.wordmark}
        </a>
        <LanguageSwitch lang={lang} />
      </header>
      <NeedsScript t={t} />
      <h1 className="text-2xl font-semibold">{t.account.title}</h1>
      <dl className="space-y-1">
        <dt className="text-sm">{t.account.phone}</dt>
        <dd>{formatPhone(user.phone)}</dd>
      </dl>
      {areas.length ? (
        <nav aria-label={t.account.areas} className="space-y-2">
          <h2 className="text-lg font-semibold">{t.account.areas}</h2>
          <ul className="space-y-1">
            {areas.map((area) => (
              <li key={area.href}>
                <a className="underline underline-offset-4" href={area.href}>
                  {area.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <LogoutButtons lang={lang} />
    </main>
  );
}
