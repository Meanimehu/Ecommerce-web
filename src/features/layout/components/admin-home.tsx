import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StateBlock } from '@/components/common/state-block';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { homePath } from '@/lib/routes';
import { adminScreenLinks } from '@/features/layout/menus';
import { NAV_ICONS } from '@/features/layout/nav-items';

/**
 * Admin home (Document 5, section 8.3; approved Stage 5): links to the screens this person's roles
 * can use (`auth`'s rule, through `menus.ts`). A staff role with no screen sees an empty "no
 * access" box with a way to the storefront. Drawn on the server.
 */
export function AdminHome({ lang, roles }: { lang: Locale; roles: readonly string[] }) {
  const messages = getMessages(lang);
  const areaMessages = messages.areas;
  const screenLinks = adminScreenLinks(lang, messages, roles);
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <h1 className="type-h2 stitch-bottom pb-3 text-ink">{areaMessages.adminHome}</h1>
        {screenLinks.length > 0 ? <p className="text-ink-2">{areaMessages.adminIntro}</p> : null}
      </div>
      {screenLinks.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {screenLinks.map((screenLink) => {
            const Icon = NAV_ICONS[screenLink.icon];
            return (
              <li key={screenLink.href}>
                <a
                  href={screenLink.href}
                  className="flex min-h-14 items-center gap-3 rounded-1 border border-line bg-surface px-4 py-3 underline underline-offset-4 hover:border-ink"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-madder" />
                  {screenLink.label}
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <StateBlock
          icon={Shield}
          title={areaMessages.noScreens}
          text={areaMessages.noScreensText}
          titleAs="h2"
        >
          <Button asChild variant="secondary">
            <a href={homePath(lang)} className="no-underline">
              {messages.noAccess.home}
            </a>
          </Button>
        </StateBlock>
      )}
    </div>
  );
}
