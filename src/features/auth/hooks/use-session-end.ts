'use client';

import { useEffect, useState } from 'react';
import { BackendErrorCode } from '@/lib/error-codes';
import { AppError } from '@/lib/errors';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n';
import { loginPath } from '@/lib/routes';

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
  const firstPathPart = window.location.pathname.split('/')[1];
  const lang = isLocale(firstPathPart) ? firstPathPart : DEFAULT_LOCALE;
  if (window.location.pathname === loginPath(lang)) {
    ending = false;
    window.dispatchEvent(new Event(NOTICE_EVENT));
    return;
  }
  // A full page load on purpose: the login page is rendered on the server without the cleared
  // cookies.
  window.location.assign(loginPath(lang, window.location.pathname + window.location.search));
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
