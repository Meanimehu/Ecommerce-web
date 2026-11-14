import { Shield } from 'lucide-react';
import { adminScreens } from '@/features/layout/menus';
import { NAV_ICONS } from '@/features/layout/nav-icons';
import { requireUser } from '@/features/auth/components/require-user';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { getMessages } from '@/lib/messages';
import { isStaff } from '@/features/auth/types';

/**
 * Admin home (Document 5, section 8.3; approved Stage 5): links to the screens this person's roles can use. A staff
 * role with no screen sees an empty "no access" box with a way to the storefront.
 */
export default async function AdminHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: param } = await params;
  const result = await requireUser(param, (user) => isStaff(user.roles));
  if ('render' in result) return result.render;
  const { lang, user } = result;
  const t = getMessages(lang);
  const screens = adminScreens(user.roles);
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <h1 className="type-h2 stitch-bottom pb-3 text-ink">{t.areas.adminHome}</h1>
        {screens.length ? <p className="text-ink-2">{t.areas.adminIntro}</p> : null}
      </div>
      {screens.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {screens.map((screen) => {
            const Icon = NAV_ICONS[screen.icon];
            return (
              <li key={screen.key}>
                <a href={`/${lang}/admin/${screen.path}`} className="flex min-h-14 items-center gap-3 rounded-1 border border-line bg-surface px-4 py-3 underline underline-offset-4 hover:border-ink">
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-madder" />
                  {t.nav.admin[screen.key]}
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <StateBlock icon={Shield} title={t.areas.noScreens} text={t.areas.noScreensText} titleAs="h2">
          <Button asChild variant="secondary">
            <a href={`/${lang}`} className="no-underline">
              {t.noAccess.home}
            </a>
          </Button>
        </StateBlock>
      )}
    </div>
  );
}
