'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getSession, send } from '@/lib/client/api';
import { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/**
 * Shown by a page whose access token is missing or expired. A page render cannot set cookies, so the browser asks
 * GET /api/session, which refreshes safely and sets the new cookies; then the page renders again (Document 4,
 * section 9). Session ended: compare-and-clear, then login. Temporary or stale: a message, and the person stays.
 */
export function SessionCheck({ lang, path }: { lang: Locale; path: string }) {
  const t = getMessages(lang);
  const router = useRouter();
  const [problem, setProblem] = useState<'temporary' | 'stale' | 'blocked' | null>(null);

  useEffect(() => {
    let cancelled = false;
    // A full page load on purpose: the next page is rendered on the server with the changed cookies.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    const toLogin = () => window.location.assign(`/${lang}/login?next=${encodeURIComponent(path)}`);
    getSession()
      .then((answer) => {
        if (cancelled) return;
        if (answer.user) router.refresh();
        else toLogin();
      })
      .catch(async (error: unknown) => {
        if (cancelled) return;
        const failure = error instanceof AppError ? error : null;
        const handle = failure?.details?.handle;
        if (failure && (failure.code === 'SESSION_ENDED' || failure.code === 'USER_BLOCKED')) {
          if (typeof handle === 'string') await send('/api/session/clear', { handle }).catch(() => undefined);
          if (failure.code === 'USER_BLOCKED') setProblem('blocked');
          else toLogin();
          return;
        }
        setProblem(failure?.code === 'SESSION_STALE' ? 'stale' : 'temporary');
      });
    return () => {
      cancelled = true;
    };
  }, [lang, path, router]);

  if (!problem) {
    return (
      <p role="status" className="p-4 text-sm">
        {t.session.checking}
      </p>
    );
  }
  const text = problem === 'blocked' ? t.session.blocked : problem === 'stale' ? t.session.changed : t.session.tryShortly;
  return (
    <div role="alert" className="space-y-3 p-4">
      <p>{text}</p>
      <div className="flex gap-3">
        {problem !== 'blocked' ? (
          <Button type="button" onClick={() => window.location.reload()}>
            {t.errors.tryAgain}
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <a href={`/${lang}/login`}>{t.nav.logIn}</a>
        </Button>
      </div>
    </div>
  );
}
