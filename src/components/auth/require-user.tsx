import { CircleAlert } from 'lucide-react';
import { forbidden, notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getMessages, isLocale, type Locale } from '@/lib/i18n';
import type { User } from '@/types/auth';
import { getViewer } from '@/middleware/session';
import { StateBlock } from '@/components/common/state-block';
import { Button } from '@/components/ui/button';
import { SessionCheck } from './session-check';

/**
 * Pages that need login (Document 2, section 5). Not logged in: the login page, returning here afterwards (D2-03).
 * Wrong role: a real 403 page. Access token expired: the browser refreshes first (SessionCheck).
 * Returns the person, or what to render instead.
 */
export async function requireUser(
  langParam: string,
  path: string,
  allowed: (user: User) => boolean = () => true,
): Promise<{ user: User; lang: Locale } | { render: ReactNode }> {
  if (!isLocale(langParam)) notFound();
  const lang = langParam;
  const viewer = await getViewer();
  if (viewer.state === 'anonymous') redirect(`/${lang}/login?next=${encodeURIComponent(path)}`);
  if (viewer.state === 'needs-refresh') return { render: <SessionCheck lang={lang} path={path} /> };
  if (viewer.state === 'unavailable') {
    const t = getMessages(lang);
    return {
      render: (
        <main role="alert" className="mx-auto grid w-full max-w-[640px] px-4 py-12">
          <StateBlock icon={CircleAlert} title={t.errorPage.title} text={t.session.tryShortly}>
            <Button asChild>
              <a href={path} className="no-underline">
                {t.errors.tryAgain}
              </a>
            </Button>
          </StateBlock>
        </main>
      ),
    };
  }
  if (!allowed(viewer.user)) forbidden();
  return { user: viewer.user, lang };
}
