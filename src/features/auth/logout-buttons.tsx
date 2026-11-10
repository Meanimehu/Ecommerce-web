'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  async function logOut(everywhere: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { handle } = await send<{ handle: string | null }>(everywhere ? '/api/auth/logout-all' : '/api/auth/logout');
      if (handle) await send('/api/session/clear', { handle });
      queryClient.clear();
      forgetCsrf();
      // A full page load on purpose: the next page is rendered on the server with the changed cookies.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/${lang}`);
    } catch (problem) {
      setError(problem instanceof AppError ? problem : new AppError({ code: 'NETWORK', status: 0 }));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => void logOut(false)}>
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
              <AlertDialogAction onClick={() => void logOut(true)}>{t.account.confirmYes}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error ? <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} t={t} /> : null}
    </div>
  );
}
