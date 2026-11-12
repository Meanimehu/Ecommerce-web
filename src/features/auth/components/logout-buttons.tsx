'use client';

import { LogOut } from 'lucide-react';
import { ErrorMessage } from '@/components/common/error-message';
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
import { messageFor } from '@/lib/errors';
import { type Locale } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { useLogout } from '@/features/auth/hooks/use-auth';

/**
 * "Log out" and "Log out everywhere" (Document 2, section 4; Document 5, section 6.5), as the
 * approved Stage 5 security card: a secondary "Log out", and "Log out everywhere" as a destructive
 * button that opens a confirmation whose confirm button is the solid error colour (Document 6, 8.2
 * and 8.10).
 */
export function LogoutButtons({ lang }: { lang: Locale }) {
  const messages = useMessages();
  const logOut = useLogout(lang);
  const busy = logOut.isPending || logOut.isSuccess;
  // Every failure reaches us as an AppError (lib/http.ts).
  const error = logOut.error;

  return (
    <section
      aria-labelledby="sessions-heading"
      className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="sessions-heading" className="type-h3 text-ink">
        {messages.account.sessions}
      </h2>
      <div>
        <Button
          type="button"
          variant="secondary"
          loading={busy && logOut.variables === false}
          disabled={busy}
          onClick={() => logOut.mutate(false)}
        >
          {busy && logOut.variables === false
            ? messages.account.loggingOut
            : messages.account.logOut}
        </Button>
      </div>
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="font-medium text-ink">{messages.account.logOutEverywhere}</p>
        <p className="type-small text-muted-foreground">{messages.account.logOutEverywhereHelp}</p>
        <div className="pt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={busy}>
                <LogOut aria-hidden="true" />
                {messages.account.logOutEverywhere}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{messages.account.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{messages.account.confirmBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{messages.account.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="destructiveConfirm" onClick={() => logOut.mutate(true)}>
                  {messages.account.confirmYes}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {error ? (
        <ErrorMessage
          text={messageFor(error, messages)}
          requestId={error.requestId}
          messages={messages}
        />
      ) : null}
    </section>
  );
}
