'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { forgetCsrf, send } from '@/lib/client/api';
import { reloadSession } from '@/lib/client/reconcile';
import { AppError, messageFor } from '@/lib/errors';
import type { Locale } from '@/lib/i18n';
import { getMessages } from '@/lib/messages';
import { ErrorMessage } from '../common/error-message';

/**
 * "Log out" and "Log out everywhere" (Document 2, section 4; Document 5, section 6.5). The backend is asked to end the
 * session; then compare-and-clear removes the cookies even if the backend could not be reached.
 */
export function LogoutButtons({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const queryClient = useQueryClient();
  // Ask the backend to end the session, then compare-and-clear the cookies (Document 2, section 4; D-02).
  const logOut = useMutation({
    mutationFn: async (everywhere: boolean) => {
      const { handle } = await send<{ handle: string | null }>(everywhere ? '/api/auth/logout-all' : '/api/auth/logout');
      if (handle) await send('/api/session/clear', { handle });
    },
    onSuccess: () => leave(),
    onError: async (raw) => {
      // Unknown outcome: look at the session once, and go by what is there (Document 3, section 6).
      if (raw instanceof AppError && raw.outcomeUnknown) {
        const answer = await reloadSession(queryClient);
        if (answer && !answer.user) leave();
      }
    },
  });

  function leave() {
    queryClient.clear();
    forgetCsrf();
    // A full page load on purpose: the next page is rendered on the server without the cookies.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/${lang}`);
  }
  const busy = logOut.isPending || logOut.isSuccess;
  const error = logOut.error ? (logOut.error instanceof AppError ? logOut.error : new AppError({ code: 'NETWORK', status: 0 })) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => logOut.mutate(false)}>
          {busy ? t.account.loggingOut : t.account.logOut}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={busy}>
              {t.account.logOutEverywhere}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.account.confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.account.confirmBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.account.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => logOut.mutate(true)}>{t.account.confirmYes}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error ? <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} t={t} /> : null}
    </div>
  );
}
