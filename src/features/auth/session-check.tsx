'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { send } from '@/lib/client/api';
import { useSession } from '@/lib/client/session';
import { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/**
 * Shown by a page whose access token is missing or expired. A page render cannot set cookies, so the browser asks
 * GET /api/session (a TanStack query, D-02), which refreshes safely and sets the new cookies; then the page renders
 * again (Document 4, section 9). Session ended: compare-and-clear, then login. Temporary or stale: a message, and the
 * person stays.
 */
export function SessionCheck({ lang, path }: { lang: Locale; path: string }) {
  const t = getMessages(lang);
  const router = useRouter();
  const session = useSession();
  const clear = useMutation({ mutationFn: (handle: string) => send('/api/session/clear', { handle }) });
  const error = useMemo(
    () => (session.error instanceof AppError ? session.error : session.error ? new AppError({ code: 'NETWORK', status: 0 }) : null),
    [session.error],
  );
  const clearSession = clear.mutate;

  useEffect(() => {
    const toLogin = () => {
      // A full page load on purpose: the login page is rendered on the server with the current cookies.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/${lang}/login?next=${encodeURIComponent(path)}`);
    };
    if (session.data) {
      if (session.data.user) router.refresh();
      else toLogin();
      return;
    }
    if (error && (error.code === 'SESSION_ENDED' || error.code === 'USER_BLOCKED')) {
      const handle = error.details?.handle;
      const done = () => (error.code === 'SESSION_ENDED' ? toLogin() : undefined);
      if (typeof handle === 'string') clearSession(handle, { onSettled: done });
      else done();
    }
  }, [session.data, error, lang, path, router, clearSession]);

  if (!error || error.code === 'SESSION_ENDED') {
    return (
      <p role="status" className="p-4 text-sm">
        {t.session.checking}
      </p>
    );
  }
  const text = error.code === 'USER_BLOCKED' ? t.session.blocked : error.code === 'SESSION_STALE' ? t.session.changed : t.session.tryShortly;
  return (
    <div role="alert" className="space-y-3 p-4">
      <p>{text}</p>
      <div className="flex gap-3">
        {error.code !== 'USER_BLOCKED' ? (
          <Button type="button" onClick={() => void session.refetch()}>
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
