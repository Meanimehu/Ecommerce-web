'use client';

import { AppError } from '@/lib/errors';
import { isLocale } from '@/lib/i18n';
import { forgetCsrf, send } from './api';

/**
 * One place that ends the session in the browser when the backend confirms it is over (Document 2, section 4;
 * D2-05): SESSION_ENDED or USER_BLOCKED from any call, on any screen (including "logged out in another tab": the
 * next call ends it here). The cookies are cleared by compare-and-clear (Document 4, section 9), then the login page
 * shows "Please log in again" (or the blocked message instead of the login form) and returns the person afterwards.
 */
const NOTICE_KEY = 'dhaaga:session-notice';
export const NOTICE_EVENT = 'dhaaga:session-notice';
export type SessionNotice = 'ended' | 'blocked';

let ending = false;

export function endsSession(error: unknown): boolean {
  return error instanceof AppError && (error.code === 'SESSION_ENDED' || error.code === 'USER_BLOCKED');
}

export async function endSession(error: AppError): Promise<void> {
  if (ending) return;
  ending = true;
  const handle = error.details?.handle;
  if (typeof handle === 'string') await send('/api/session/clear', { handle }).catch(() => undefined);
  forgetCsrf();
  const notice: SessionNotice = error.code === 'USER_BLOCKED' ? 'blocked' : 'ended';
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
  // A full page load on purpose: the login page is rendered on the server without the cleared cookies.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/${lang}/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
}

/** The notice for the login page, shown once. */
export function takeSessionNotice(): SessionNotice | null {
  try {
    const value = sessionStorage.getItem(NOTICE_KEY);
    sessionStorage.removeItem(NOTICE_KEY);
    return value === 'ended' || value === 'blocked' ? value : null;
  } catch {
    return null;
  }
}
