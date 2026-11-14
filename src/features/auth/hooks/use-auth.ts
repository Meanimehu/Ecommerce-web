'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { get, send } from '@/lib/http';
import type { Locale } from '@/lib/i18n';
import { homePath } from '@/lib/routes';
import type { AddNotice } from '@/types/add-notice';
import type { SessionAnswer } from '@/features/auth/types';

/**
 * The calls of `auth`, one hook per call, to our own endpoints: who is logged in (Document 4,
 * section 9), the two login calls (Document 2, section 3) and logout (Document 2, section 4).
 */
const AUTH_PATHS = {
  session: '/api/session',
  requestCode: '/api/auth/code',
  verifyCode: '/api/auth/verify',
  logout: '/api/auth/logout',
  logoutEverywhere: '/api/auth/logout-all',
} as const;

/** Who is logged in (D-02). Never cached across people. */
export const sessionKeys = { all: ['session'] as const };

const getSession = () => get<SessionAnswer>(AUTH_PATHS.session);

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: getSession,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * A change whose outcome is unknown (timeout, lost connection): reload the session once, then go by
 * what is actually there (Document 3, section 6; D7-10). Used after login and logout. Returns null
 * when even the reload cannot be done.
 */
export async function reloadSession(queryClient: QueryClient): Promise<SessionAnswer | null> {
  try {
    return await queryClient.fetchQuery({
      queryKey: sessionKeys.all,
      queryFn: getSession,
      staleTime: 0,
    });
  } catch {
    return null;
  }
}

export interface LoginCodeSent {
  resendAfterSeconds: number;
}

export interface VerifyLoginCodeInput {
  phone: string;
  code: string;
  lang: Locale;
}

export interface LoggedIn {
  /** Where to go next: the page the person asked for, else the default for their role (D2-03). */
  destination: string;
  /** What happened to an "Add to cart" made before logging in, when there was one (D2-02). */
  pendingAdd?: AddNotice;
}

export function useRequestLoginCode() {
  return useMutation({
    mutationFn: (phone: string) => send<LoginCodeSent>(AUTH_PATHS.requestCode, { phone }),
  });
}

export function useVerifyLoginCode() {
  return useMutation({
    mutationFn: (input: VerifyLoginCodeInput) => send<LoggedIn>(AUTH_PATHS.verifyCode, input),
  });
}

/**
 * "Log out" (false) and "Log out everywhere" (true). Our server asks the backend to end the
 * session and clears the cookies in its answer, even if the backend could not be reached.
 * Afterwards the person goes to the home page, loaded fresh so it is rendered without the cookies.
 */
export function useLogout(lang: Locale) {
  const queryClient = useQueryClient();
  const leave = () => {
    queryClient.clear();
    window.location.assign(homePath(lang));
  };
  return useMutation({
    mutationFn: (everywhere: boolean) =>
      send(everywhere ? AUTH_PATHS.logoutEverywhere : AUTH_PATHS.logout),
    onSuccess: leave,
    onError: async (error) => {
      // Unknown outcome: look at the session once, and go by what is there (Document 3, section 6).
      if (error.outcomeUnknown) {
        const answer = await reloadSession(queryClient);
        if (answer && !answer.user) leave();
      }
    },
  });
}
