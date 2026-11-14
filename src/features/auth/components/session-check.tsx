'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { loginPath } from '@/lib/routes';
import { useSession } from '@/features/auth/hooks/use-auth';
import { endsSession } from '@/features/auth/hooks/use-session-end';

/**
 * Shown by a page whose access token is missing or expired. A page render cannot set cookies, so
 * the browser asks GET /api/session (a TanStack query, D-02), which refreshes safely and sets the
 * new cookies; then the page renders again (Document 4, section 9). Session ended or blocked:
 * handled in one place for every screen (`features/auth/hooks/use-session-end.ts`). No clear
 * answer: a message, and the person stays.
 */
export function SessionCheck({ lang, path }: { lang: Locale; path: string }) {
  const messages = useMessages();
  const router = useRouter();
  const session = useSession();
  // Every failure reaches us as an AppError (lib/http.ts).
  const error = session.error;

  useEffect(() => {
    if (!session.data) return;
    if (session.data.user) router.refresh();
    // A full page load on purpose: the login page is rendered on the server with the current
    // cookies.
    else window.location.assign(loginPath(lang, path));
  }, [session.data, lang, path, router]);

  if (!error || endsSession(error)) {
    // Loading: a static skeleton in the shape of a page, announced as a status (Document 6, section
    // 10).
    return (
      <div className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p role="status" className="sr-only">
          {messages.session.checking}
        </p>
        <Skeleton className="h-10 w-2/3 max-w-[420px]" />
        <Skeleton className="h-32 w-full max-w-[520px]" />
        <Skeleton className="h-32 w-full max-w-[520px]" />
      </div>
    );
  }
  return (
    <div className="mx-auto grid w-full max-w-[640px] px-4 py-12">
      <Banner
        tone="error"
        role="alert"
        title={messages.session.tryShortly}
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void session.refetch()}>
              {messages.errors.tryAgain}
            </Button>
            <Button asChild variant="secondary">
              <a href={loginPath(lang)} className="no-underline">
                {messages.nav.logIn}
              </a>
            </Button>
          </div>
        }
      />
    </div>
  );
}
