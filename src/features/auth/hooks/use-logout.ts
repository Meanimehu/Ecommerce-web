'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppError } from '@/lib/errors';
import { send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import { reloadSession } from './use-session';

/**
 * "Log out" (false) and "Log out everywhere" (true) (Document 2, section 4). Our server asks the backend to end the
 * session and clears the cookies in its answer, even if the backend could not be reached. Afterwards the person goes
 * to the home page, loaded fresh so it is rendered without the cookies.
 */
export function useLogout(lang: Locale) {
  const queryClient = useQueryClient();
  const leave = () => {
    queryClient.clear();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/${lang}`);
  };
  return useMutation({
    mutationFn: (everywhere: boolean) => send(everywhere ? '/api/auth/logout-all' : '/api/auth/logout'),
    onSuccess: leave,
    onError: async (raw) => {
      // Unknown outcome: look at the session once, and go by what is there (Document 3, section 6).
      if (raw instanceof AppError && raw.outcomeUnknown) {
        const answer = await reloadSession(queryClient);
        if (answer && !answer.user) leave();
      }
    },
  });
}
