'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { isLocale } from '@/lib/i18n';
import { get } from '@/lib/http';
import type { SessionAnswer } from '@/types/auth';

/** Who is logged in (D-02; Document 4, section 9). Never cached across people. */
export const SESSION_QUERY_KEY = ['session'] as const;

const getSession = () => get<SessionAnswer>('/api/session');

export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
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
      queryKey: SESSION_QUERY_KEY,
      queryFn: getSession,
      staleTime: 0,
    });
  } catch {
    return null;
  }
}

/**
 * One place that ends the session in the browser when the backend confirms it is over (Document 2,
 * section 4; D2-05): SESSION_ENDED or USER_BLOCKED from any call, on any screen (including "logged
 * out in another tab": the next call ends it here). Our server has already cleared the cookies in
 * that answer. The login page then shows "Please log in again" (or the blocked message instead of
 * the login form) and returns the person afterwards.
 */
const NOTICE_KEY = 'dhaaga:session-notice';
export const NOTICE_EVENT = 'dhaaga:session-notice';
/** The notice left for the login page. The values are what is stored in the browser. */
export enum SessionNotice {
  Ended = 'ended',
  Blocked = 'blocked',
}

const SESSION_NOTICES: readonly string[] = Object.values(SessionNotice);

function isSessionNotice(value: string | null): value is SessionNotice {
  return value !== null && SESSION_NOTICES.includes(value);
}

let ending = false;

export function endsSession(error: unknown): boolean {
  if (!(error instanceof AppError)) return false;
  return (
    error.code === BackendErrorCode.SessionEnded || error.code === BackendErrorCode.UserBlocked
  );
}

export function endSession(error: AppError): void {
  if (ending) return;
  ending = true;
  const notice =
    error.code === BackendErrorCode.UserBlocked ? SessionNotice.Blocked : SessionNotice.Ended;
  try {
    sessionStorage.setItem(NOTICE_KEY, notice);
  } catch {
    // Storage may be unavailable; the person still reaches the login page.
  }
  const first = window.location.pathname.split('/')[1];
  const lang = isLocale(first) ? first : 'en';
  if (window.location.pathname === `/${lang}/login`) {
    ending = false;
    window.dispatchEvent(new Event(NOTICE_EVENT));
    return;
  }
  // A full page load on purpose: the login page is rendered on the server without the cleared
  // cookies.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(
    `/${lang}/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
  );
}

/** The notice for the login page, shown once. */
export function takeSessionNotice(): SessionNotice | null {
  try {
    const storedNotice = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    return isSessionNotice(storedNotice) ? storedNotice : null;
  } catch {
    return null;
  }
}

/** The notice for the login page, read once when it opens and again whenever a session ends. */
export function useSessionNotice(): SessionNotice | null {
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);

  useEffect(() => {
    function readNotice() {
      const notice = takeSessionNotice();
      if (notice) setSessionNotice(notice);
    }

    readNotice();
    window.addEventListener(NOTICE_EVENT, readNotice);
    return () => window.removeEventListener(NOTICE_EVENT, readNotice);
  }, []);

  return sessionNotice;
}
