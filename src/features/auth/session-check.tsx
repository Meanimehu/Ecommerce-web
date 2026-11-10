'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/client/session';
import { endsSession } from '@/lib/client/session-end';
import { AppError } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';

/**
 * Shown by a page whose access token is missing or expired. A page render cannot set cookies, so the browser asks
 * GET /api/session (a TanStack query, D-02), which refreshes safely and sets the new cookies; then the page renders
 * again (Document 4, section 9). Session ended or blocked: handled in one place for every screen (session-end.ts).
 * Temporary or stale: a message, and the person stays.
 */
export function SessionCheck({ lang, path }: { lang: Locale; path: string }) {
  const t = getMessages(lang);
  const router = useRouter();
  const session = useSession();
  const error = useMemo(
    () => (session.error instanceof AppError ? session.error : session.error ? new AppError({ code: 'NETWORK', status: 0 }) : null),
    [session.error],
  );

  useEffect(() => {
    if (!session.data) return;
    if (session.data.user) router.refresh();
    // A full page load on purpose: the login page is rendered on the server with the current cookies.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    else window.location.assign(`/${lang}/login?next=${encodeURIComponent(path)}`);
  }, [session.data, lang, path, router]);

  if (!error || endsSession(error)) {
    return (
      <p role="status" className="p-4 text-sm">
        {t.session.checking}
      </p>
    );
  }
  return (
    <div role="alert" className="space-y-3 p-4">
      <p>{error.code === 'SESSION_STALE' ? t.session.changed : t.session.tryShortly}</p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => void session.refetch()}>
          {t.errors.tryAgain}
        </Button>
        <Button asChild variant="outline">
          <a href={`/${lang}/login`}>{t.nav.logIn}</a>
        </Button>
      </div>
    </div>
  );
}
