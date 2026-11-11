'use client';

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
import { useLogout } from '@/hooks/use-logout';
import { AppError, messageFor } from '@/lib/errors';
import { getMessages, type Locale } from '@/lib/i18n';
import { ErrorMessage } from '@/components/common/error-message';

/**
 * "Log out" and "Log out everywhere" (Document 2, section 4; Document 5, section 6.5). Our server asks the backend to
 * end the session and clears the cookies in its answer, even if the backend could not be reached.
 */
export function LogoutButtons({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const logOut = useLogout(lang);
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
