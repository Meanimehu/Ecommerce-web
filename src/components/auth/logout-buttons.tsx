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
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-logout';
import { AppError, messageFor } from '@/lib/errors';
import { getMessages, type Locale } from '@/lib/i18n';
import { ErrorMessage } from '@/components/common/error-message';

/**
 * "Log out" and "Log out everywhere" (Document 2, section 4; Document 5, section 6.5), as the approved Stage 5 security
 * card: a secondary "Log out", and "Log out everywhere" as a destructive button that opens a confirmation whose confirm
 * button is the solid error colour (Document 6, 8.2 and 8.10).
 */
export function LogoutButtons({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const logOut = useLogout(lang);
  const busy = logOut.isPending || logOut.isSuccess;
  const error = logOut.error ? (logOut.error instanceof AppError ? logOut.error : new AppError({ code: 'NETWORK', status: 0 })) : null;

  return (
    <section aria-labelledby="sessions-heading" className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="sessions-heading" className="type-h3 text-ink">
        {t.account.sessions}
      </h2>
      <div>
        <Button type="button" variant="secondary" loading={busy && logOut.variables === false} disabled={busy} onClick={() => logOut.mutate(false)}>
          {busy && logOut.variables === false ? t.account.loggingOut : t.account.logOut}
        </Button>
      </div>
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="font-medium text-ink">{t.account.logOutEverywhere}</p>
        <p className="type-small text-muted-foreground">{t.account.logOutEverywhereHelp}</p>
        <div className="pt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={busy}>
                <LogOut aria-hidden="true" />
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
                <AlertDialogAction variant="destructiveConfirm" onClick={() => logOut.mutate(true)}>
                  {t.account.confirmYes}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {error ? <ErrorMessage text={messageFor(error, t)} requestId={error.requestId} t={t} /> : null}
    </section>
  );
}
