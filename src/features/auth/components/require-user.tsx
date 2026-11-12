import { CircleAlert } from 'lucide-react';
import { headers } from 'next/headers';
import { forbidden, notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { isLocale, type Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { PATH_HEADER } from '@/middleware/cookies';
import { getViewer, ViewerState } from '@/features/auth/server/session';
import type { User } from '@/features/auth/types';
import { SessionCheck } from './session-check';

/**
 * Pages that need login (Document 2, section 5). Not logged in: the login page, returning here
 * afterwards (D2-03). Wrong role: a real 403 page. Access token expired: the browser refreshes
 * first (SessionCheck). Returns the person, or what to render instead.
 */
export async function requireUser(
  langParam: string,
  allowed: (user: User) => boolean = () => true,
): Promise<{ user: User; lang: Locale; token: string } | { render: ReactNode }> {
  if (!isLocale(langParam)) notFound();
  const lang = langParam;
  const path = await currentPath(lang);
  const viewer = await getViewer();
  if (viewer.state === ViewerState.Anonymous)
    redirect(`/${lang}/login?next=${encodeURIComponent(path)}`);
  if (viewer.state === ViewerState.NeedsRefresh)
    return { render: <SessionCheck lang={lang} path={path} /> };
  if (viewer.state === ViewerState.Unavailable) return { render: <Unavailable lang={lang} /> };
  if (!allowed(viewer.user)) forbidden();
  return { user: viewer.user, lang, token: viewer.token };
}

/**
 * The address of the page being rendered (set by proxy.ts), else the language's home. Only `auth`
 * uses it: for the page to return to after login, and for the "Try again" link.
 */
async function currentPath(lang: Locale): Promise<string> {
  const path = (await headers()).get(PATH_HEADER);
  return path?.startsWith(`/${lang}`) ? path : `/${lang}`;
}

/**
 * "Try again shortly": the backend could not be asked who this is, or what they have (Document 2,
 * D2-05). "Try again" reloads the same page, so the screen finds its own address.
 */
export async function Unavailable({ lang }: { lang: Locale }) {
  const messages = getMessages(lang);
  const path = await currentPath(lang);
  return (
    <main role="alert" className="mx-auto grid w-full max-w-[640px] px-4 py-12">
      <StateBlock
        icon={CircleAlert}
        title={messages.errorPage.title}
        text={messages.session.tryShortly}
      >
        <Button asChild>
          <a href={path} className="no-underline">
            {messages.errors.tryAgain}
          </a>
        </Button>
      </StateBlock>
    </main>
  );
}
